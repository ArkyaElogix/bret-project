# app/services/ai_report_service.py
import os
import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from openai import OpenAI
from app.models.models import (
    AssessmentSession, Response, Question,
    BehaviouralFactor, BehaviouralType, SectionScore,
    User, Form
)


class AIReportService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = "gpt-4o-mini"

    def generate_report(self, session_id: int, db: Session) -> Dict[str, Any]:
        """Generate AI-powered report for a completed session."""

        session = db.query(AssessmentSession).filter(
            AssessmentSession.id == session_id
        ).first()

        if not session or session.status != "submitted":
            raise ValueError("Session not found or not submitted")

        context = self._build_context(session_id, db)
        report = self._generate_sections(context)
        return report

    def _build_context(self, session_id: int, db: Session) -> Dict[str, Any]:
        """Build comprehensive context for AI to generate report."""

        session = db.query(AssessmentSession).filter(
            AssessmentSession.id == session_id
        ).first()

        user = db.query(User).filter(User.id == session.user_id).first()
        form = db.query(Form).filter(Form.id == session.form_id).first()

        responses = (
            db.query(Response)
            .join(Question)
            .filter(Response.session_id == session_id)
            .all()
        )

        scores = (
            db.query(SectionScore)
            .filter(SectionScore.session_id == session_id)
            .all()
        )

        factor_ids = [s.factor_id for s in scores]
        factors = {
            f.id: f for f in db.query(BehaviouralFactor)
            .filter(BehaviouralFactor.id.in_(factor_ids))
            .all()
        }

        types = {
            t.id: t for t in db.query(BehaviouralType)
            .filter(BehaviouralType.id.in_([s.section_id for s in scores]))
            .all()
        }

        context = {
            "candidate": {
                "name": user.name,
                "email": user.email,
                "product_type": user.account_type.value
            },
            "form": {
                "id": form.id,
                "name": form.name
            },
            "responses": [
                {
                    "question_number": r.question.number,
                    "section": getattr(types.get(r.question.behavioural_type_id), "name", ""),
                    "chosen_option": r.chosen_option,
                    "option_a": r.question.option_a_text,
                    "option_b": r.question.option_b_text,
                    "factor_a": getattr(factors.get(r.question.option_a_factor_id), "name", ""),
                    "factor_b": getattr(factors.get(r.question.option_b_factor_id), "name", "")
                }
                for r in responses
            ],
            "scores": [
                {
                    "section_id": s.section_id,
                    "section_name": getattr(types.get(s.section_id), "name", ""),
                    "section_code": getattr(types.get(s.section_id), "code", ""),
                    "factor_id": s.factor_id,
                    "factor_name": getattr(factors.get(s.factor_id), "name", ""),
                    "score": s.score,
                    "max_score": 5
                }
                for s in scores
            ]
        }

        context["score_summary"] = self._analyze_scores(context["scores"])
        return context

    def _analyze_scores(self, scores: List[Dict]) -> Dict:
        summary = {
            "highest_scoring_factors": [],
            "lowest_scoring_factors": [],
            "dominant_patterns": {},
            "balanced_factors": []
        }

        section_scores = {}
        for s in scores:
            section = s["section_name"]
            section_scores.setdefault(section, []).append(s)

        for section, factors in section_scores.items():
            sorted_factors = sorted(factors, key=lambda x: x["score"], reverse=True)
            if sorted_factors:
                summary["highest_scoring_factors"].append({
                    "section": section,
                    "factor": sorted_factors[0]["factor_name"],
                    "score": sorted_factors[0]["score"]
                })
                if len(sorted_factors) > 1:
                    summary["lowest_scoring_factors"].append({
                        "section": section,
                        "factor": sorted_factors[-1]["factor_name"],
                        "score": sorted_factors[-1]["score"]
                    })

            scores_list = [f["score"] for f in factors]
            if max(scores_list) - min(scores_list) <= 2:
                summary["balanced_factors"].append(section)

        return summary

    def _generate_sections(self, context: Dict) -> Dict[str, Any]:
        """Generate all sections using the available methods."""

        section_a = [s for s in context["scores"] if s["section_code"] == "A"]
        product_type = str(context.get("candidate", {}).get("product_type", "")).upper()

        drives_profile = self._generate_drives_profile_with_template(context, section_a)
        conditioning_profile = self._generate_conditioning_profile(context)
        communication_profile = self._generate_communication_profile(context)

        orientation_insights = {}
        if product_type != "BASIC":
            composite_insights = {
                "drives": drives_profile.get("composite_insight", ""),
                "conditioning": conditioning_profile.get("composite_insight", ""),
                "communication": communication_profile.get("composite_insight", ""),
            }
            orientation_insights = self._generate_orientation_insights(context, composite_insights)

        report = {
            "drives_profile": drives_profile,
            "conditioning_profile": conditioning_profile,
            "communication_profile": communication_profile,
            "orientation_insights": orientation_insights,
            "overall_observations": self._generate_overall_observations(context),
            "action_agenda": self._generate_action_agenda(context)
        }

        return report

    def _call(self, system: str, user: str, max_tokens: int, temperature: float,
               json_mode: bool = False) -> str:
        kwargs = dict(
            model=self.model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user}
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        response = self.client.chat.completions.create(**kwargs)
        return response.choices[0].message.content

    @staticmethod
    def _factor_prompt(factor_name: str, score: int, score_label: str, max_words: int,
                        angle: str) -> str:
        return f"""
Write a short behavioral description for exactly ONE factor. Do not mention
or reference any other factor.

Factor name: {factor_name}
Score: {score}/5 ({score_label})
What this factor measures: {angle}

Rules:
- Maximum {max_words} words. This is a hard limit, not a target.
- Exactly 3-4 short sentences.
- Second person ("You..."), plain everyday language, no jargon.
- Base the tone strictly on the score_label given above (do not invent a
  different intensity).
- Do not restate the factor name or score number in the text.
""".strip()

    def _get_score_label(self, score: int) -> str:
        labels = {
            5: "Very Strong",
            4: "Strong",
            3: "Moderate",
            2: "Mild",
            1: "Weak",
            0: "Absence"
        }
        return labels.get(score, "Moderate")

    def _generate_drives_profile_with_template(self, context: Dict, scores: List) -> Dict:
        if not scores:
            return {}

        candidate_name = context["candidate"]["name"]

        composite_prompt = f"""
Write ONE short composite insight paragraph for {candidate_name}'s core
motivational drives.

Scores (factor_name, score out of 5): {json.dumps([{'factor_name': s['factor_name'], 'score': s['score']} for s in scores])}

Rules:
- Maximum 45 words. Hard limit.
- Max 5 sentences.
- Start with the candidate's first name.
- Plain, clear language. No metaphors, no flowery phrasing.
- Reflect the actual relative scores given (higher score = stronger pull),
  do not invent scores or factors not listed above.
""".strip()

        composite_text = self._call(
            system="You write concise, plain-language behavioral summaries. You never exceed the requested word limit.",
            user=composite_prompt,
            max_tokens=130,
            temperature=0.6,
        )

        factor_descriptions = []
        for score in scores:
            label = self._get_score_label(score["score"])
            prompt = self._factor_prompt(
                factor_name=score["factor_name"],
                score=score["score"],
                score_label=label,
                max_words=28,
                angle="a core motivational drive that shapes what the person values and pursues",
            )
            desc = self._call(
                system="You write concise, plain-language behavioral descriptions. You never exceed the requested word limit.",
                user=prompt,
                max_tokens=60,
                temperature=0.5,
            )
            factor_descriptions.append({
                "factor_name": score["factor_name"],
                "score": score["score"],
                "score_label": label,
                "description": desc.strip()
            })

        return {
            "section_code": "A",
            "section_name": "Drives Profile",
            "composite_insight": composite_text.strip(),
            "factors": factor_descriptions
        }

    def _generate_conditioning_profile(self, context: Dict) -> Dict:
        section_b_scores = [
            s for s in context["scores"]
            if s["section_name"] == "Conditioned"
        ]

        if not section_b_scores:
            return {}

        composite_prompt = f"""
Write ONE short composite insight paragraph describing how this person
adapts to change and new environments.

Scores (factor_name, score out of 5): {json.dumps([{'factor_name': s['factor_name'], 'score': s['score']} for s in section_b_scores])}

Rules:
- Maximum 120 words. Hard limit.
- Max 5 sentences.
- Plain, clear language, no metaphors.
- Base the description strictly on the relative scores given.
""".strip()

        composite_text = self._call(
            system="You write concise, plain-language behavioral summaries about adaptability to change. You never exceed the requested word limit.",
            user=composite_prompt,
            max_tokens=120,
            temperature=0.6,
        )

        factor_descriptions = []
        for score in section_b_scores:
            label = self._get_score_label(score["score"])
            prompt = self._factor_prompt(
                factor_name=score["factor_name"],
                score=score["score"],
                score_label=label,
                max_words=26,
                angle="how the person responds to new ideas, change, and unfamiliar situations",
            )
            desc = self._call(
                system="You write concise, plain-language descriptions of how people respond to change. You never exceed the requested word limit.",
                user=prompt,
                max_tokens=55,
                temperature=0.5,
            )
            factor_descriptions.append({
                "factor_name": score["factor_name"],
                "score": score["score"],
                "score_label": label,
                "description": desc.strip()
            })

        return {
            "section_name": "Conditioned",
            "section_code": "B",
            "composite_insight": composite_text.strip(),
            "factors": factor_descriptions
        }

    def _generate_communication_profile(self, context: Dict) -> Dict:
        section_c_scores = [
            s for s in context["scores"]
            if s["section_name"] == "Learned"
        ]

        if not section_c_scores:
            return {}

        composite_prompt = f"""
Write ONE short composite insight paragraph describing this person's
communication style -- how they connect with and influence others.

Scores (factor_name, score out of 5): {json.dumps([{'factor_name': s['factor_name'], 'score': s['score']} for s in section_c_scores])}

Rules:
- Maximum 120 words. Hard limit.
- Max 5 sentences.
- Plain, clear language, no metaphors.
- Base the description strictly on the relative scores given.
""".strip()

        composite_text = self._call(
            system="You write concise, plain-language summaries of communication style. You never exceed the requested word limit.",
            user=composite_prompt,
            max_tokens=120,
            temperature=0.6,
        )

        factor_descriptions = []
        for score in section_c_scores:
            label = self._get_score_label(score["score"])
            prompt = self._factor_prompt(
                factor_name=score["factor_name"],
                score=score["score"],
                score_label=label,
                max_words=26,
                angle="a tendency in how the person communicates and interacts with others",
            )
            desc = self._call(
                system="You write concise, plain-language descriptions of communication tendencies. You never exceed the requested word limit.",
                user=prompt,
                max_tokens=55,
                temperature=0.5,
            )
            factor_descriptions.append({
                "factor_name": score["factor_name"],
                "score": score["score"],
                "score_label": label,
                "description": desc.strip()
            })

        return {
            "section_name": "Learned",
            "section_code": "C",
            "composite_insight": composite_text.strip(),
            "factors": factor_descriptions
        }

    def _generate_orientation_insights(
        self,
        context: Dict,
        composite_insights: Dict[str, str] | None = None,
    ) -> Dict[str, Dict[str, str]]:
        """Generate orientation insights with style label + body text, informed by
        both the raw scores and the composite insights already written for the
        Drives/Conditioning/Communication sections."""

        all_scores = context["scores"]
        composite_insights = composite_insights or {}

        composite_block = "\n".join(
            f"- {label.title()} composite insight: {text}"
            for label, text in composite_insights.items()
            if text
        ) or "None available."

        orientation_prompt = f"""
    Based on the assessment scores AND the composite insights below, write one
    insight for each of: leadership, team, motivation, change, stress.

    Scores: {json.dumps(all_scores)}

    Composite insights already written for this candidate (use these to add
    substance and continuity -- each orientation insight should feel like it
    builds on this picture of the person, not a generic restatement of the
    scores):
    {composite_block}

    Rules for EACH insight:
    - Return a JSON object with exactly these keys: leadership, team, motivation, change, stress.
    - Each value must be an object with exactly two keys:
    1) "label": a short style label, 2-5 words, plain language
    2) "body": 130-170 words, 6-8 sentences.
    - Ground the body in BOTH the relevant score pattern and the composite
    insights above -- connect this orientation back to the person's broader
    drives, conditioning, and communication style rather than repeating the
    same points across every category.
    - Body must be plain language, no jargon, no raw numbers.
    - Refer to "you", not the candidate's name.

    Return ONLY valid JSON.
    """.strip()

        raw = self._call(
            system="You write plain-language behavioral insights and always return valid JSON matching the requested schema exactly.",
            user=orientation_prompt,
            max_tokens=1100,
            temperature=0.6,
            json_mode=True,
        )

        def normalize_entry(key: str, default_label: str, default_body: str) -> Dict[str, str]:
            try:
                payload = json.loads(raw)
            except Exception:
                payload = {}

            item = payload.get(key, {})
            if isinstance(item, dict):
                label = str(item.get("label") or default_label).strip()
                body = str(item.get("body") or default_body).strip()
            elif isinstance(item, str):
                label = default_label
                body = item.strip() or default_body
            else:
                label = default_label
                body = default_body

            return {
                "label": label[:60],
                "body": body[:1400]   # was 500 -- too short for a 130-170 word body
            }

        try:
            data = json.loads(raw)
            return {
                "leadership": normalize_entry(
                    "leadership", "Leadership Style",
                    "Your leadership style is shaped by a clear mix of instinct and awareness. You tend to lead with intention when the goal is clear, and you can adjust your approach when the situation calls for more support or more direction."
                ),
                "team": normalize_entry(
                    "team", "Team Orientation",
                    "You connect with people in a balanced way, and your team presence depends on the setting. You are generally thoughtful and collaborative, but you can become more effective when you speak up early and make your preferences clear."
                ),
                "motivation": normalize_entry(
                    "motivation", "Motivation Driver",
                    "Your motivation is strongest when the work lines up with purpose, momentum, and personal meaning. You tend to stay engaged when goals feel relevant and when your effort leads to visible progress."
                ),
                "change": normalize_entry(
                    "change", "Change Driver",
                    "You respond to change best when it feels manageable and clear. You adapt through observation and gradual adjustment, and you are more effective when transitions come with enough context and support."
                ),
                "stress": normalize_entry(
                    "stress", "Stress Response",
                    "You handle pressure in a way shaped by your habits and defaults. Under stress, you may become more guarded or more internally focused, so steady reflection and a small reset routine help you stay effective."
                )
            }
        except Exception:
            return {
                "leadership": {"label": "Leadership Style", "body": "You lead with a balanced mix of awareness and deliberate action. You tend to bring clarity and calm when the situation is uncertain, and your strongest leadership comes when your direction is grounded in purpose."},
                "team": {"label": "Team Orientation", "body": "You work well with others when there is trust and open communication. You tend to be thoughtful and collaborative, and you typically add value by listening carefully before making your own mark."},
                "motivation": {"label": "Motivation Driver", "body": "You are most motivated by work that has clear meaning and visible progress. When the goal feels relevant and energizing, you become more focused and resilient."},
                "change": {"label": "Change Driver", "body": "You adapt to change through observation and gradual adjustment. You tend to do best when there is enough information and a measured pace, which helps you stay steady while you transition."},
                "stress": {"label": "Stress Response", "body": "You manage pressure by relying on your internal pattern and your usual coping style. A short pause, a clear next step, and a calm reset tend to help you stay effective under strain."}
            }

    def _generate_overall_observations(self, context: Dict) -> Dict:
        all_scores = context["scores"]
        summary = context["score_summary"]

        prompt = f"""
Based on this assessment data, write a short overall summary.

Scores: {json.dumps(all_scores)}
Pattern summary: {json.dumps(summary)}

Return ONLY a JSON object with exactly these keys:
- "integrated_pattern": a single string, maximum 90 words, 3-4 sentences,
  plain language, no jargon.
- "key_takeaways": a list of exactly 4 short strings. Each takeaway must be
  a single actionable phrase of 50 words or fewer (1 concise full paragraph).
""".strip()

        raw = self._call(
            system="You write short, plain-language behavioral summaries and always return valid JSON matching the requested schema exactly.",
            user=prompt,
            max_tokens=280,
            temperature=0.6,
            json_mode=True,
        )

        try:
            data = json.loads(raw)
            takeaways = data.get("key_takeaways", [])
            if not isinstance(takeaways, list):
                takeaways = [str(takeaways)]
            return {
                "integrated_pattern": data.get("integrated_pattern", "Balanced behavioral pattern with diverse strengths."),
                "key_takeaways": takeaways[:4]
            }
        except Exception:
            return {
                "integrated_pattern": "Balanced behavioral pattern with diverse strengths.",
                "key_takeaways": [
                    "Lean on your highest-scoring factors day to day.",
                    "Build a small habit around one lower-scoring area.",
                    "Use your strengths to support and guide others.",
                    "Revisit this profile in a few weeks to track change."
                ]
            }

    def _generate_action_agenda(self, context: Dict) -> Dict:
        all_scores = context["scores"]

        prompt = f"""
Based on the assessment results below, create a short development agenda.

Scores: {json.dumps(all_scores)}

Return ONLY a JSON object with exactly this shape:

{{
  "focus_areas": [list of exactly 3 short phrases, each 30 words or fewer],
  "roadmap": {{
    "30": "one short action, maximum 80 words",
    "60": "one short action, maximum 80 words",
    "90": "one short action, maximum 80 words"
  }},
  "ssc": {{
    "commence": "one short action to start, maximum 40 words",
    "cease": "one short behavior to stop, maximum 40 words",
    "continue": "one short behavior to continue, maximum 40 words"
  }}
}}

Rules:
- Every string value must be plain language, no jargon, no sub-clauses.
- Do not return arrays anywhere except "focus_areas".
- Do not add any keys beyond the ones listed above.
""".strip()

        raw = self._call(
            system="You write short, plain-language development plans and always return valid JSON matching the requested schema exactly, with no extra keys.",
            user=prompt,
            max_tokens=260,
            temperature=0.6,
            json_mode=True,
        )

        fallback = {
            "focus_areas": ["Leverage top strengths", "Build one new habit", "Address one growth area"],
            "roadmap": {
                "30": "Reflect on your results and pick one area to improve.",
                "60": "Apply one small habit change at work.",
                "90": "Review progress and set the next goal."
            },
            "ssc": {
                "commence": "Ask for feedback on how you come across.",
                "cease": "Stop putting off the harder conversations.",
                "continue": "Keep leaning on your strongest natural patterns."
            }
        }

        try:
            data = json.loads(raw)

            focus_areas = data.get("focus_areas", fallback["focus_areas"])
            if not isinstance(focus_areas, list):
                focus_areas = fallback["focus_areas"]

            roadmap_in = data.get("roadmap", {})
            roadmap = {
                "30": str(roadmap_in.get("30", fallback["roadmap"]["30"]))[:150],
                "60": str(roadmap_in.get("60", fallback["roadmap"]["60"]))[:150],
                "90": str(roadmap_in.get("90", fallback["roadmap"]["90"]))[:150],
            }

            ssc_in = data.get("ssc", {})
            ssc = {
                "commence": str(ssc_in.get("start", fallback["ssc"]["start"]))[:150],
                "cease": str(ssc_in.get("stop", fallback["ssc"]["stop"]))[:150],
                "continue": str(ssc_in.get("continue", fallback["ssc"]["continue"]))[:150],
            }

            return {
                "focus_areas": focus_areas[:3],
                "roadmap": roadmap,
                "ssc": ssc
            }
        except Exception:
            return fallback