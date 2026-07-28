# app/services/ai_report_service.py
import os
import json
from typing import Dict, Any, List, Optional
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
        
        # 1. Fetch all required data
        session = db.query(AssessmentSession).filter(
            AssessmentSession.id == session_id
        ).first()
        
        if not session or session.status != "submitted":
            raise ValueError("Session not found or not submitted")
        
        # 2. Build comprehensive context
        context = self._build_context(session_id, db)
        
        # 3. Generate report sections using AI
        report = self._generate_sections(context)
        
        return report
    
    def _build_context(self, session_id: int, db: Session) -> Dict[str, Any]:
        """Build comprehensive context for AI to generate report."""
        
        # Get session details
        session = db.query(AssessmentSession).filter(
            AssessmentSession.id == session_id
        ).first()
        
        user = db.query(User).filter(User.id == session.user_id).first()
        form = db.query(Form).filter(Form.id == session.form_id).first()
        
        # Get all responses with question details
        responses = (
            db.query(Response)
            .join(Question)
            .filter(Response.session_id == session_id)
            .all()
        )
        
        # Get scores
        scores = (
            db.query(SectionScore)
            .filter(SectionScore.session_id == session_id)
            .all()
        )
        
        # Get factors and types
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
        
        # Structure the data
        context = {
            "candidate": {
                "name": user.name,
                "email": user.email,
                "product_type": user.product_type.value
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
        
        # Add scoring insights
        context["score_summary"] = self._analyze_scores(context["scores"])
        
        return context
    
    def _analyze_scores(self, scores: List[Dict]) -> Dict:
        """Analyze score patterns for AI context."""
        summary = {
            "highest_scoring_factors": [],
            "lowest_scoring_factors": [],
            "dominant_patterns": {},
            "balanced_factors": []
        }
        
        # Group scores by section
        section_scores = {}
        for s in scores:
            section = s["section_name"]
            if section not in section_scores:
                section_scores[section] = []
            section_scores[section].append(s)
        
        # Find highest and lowest per section
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
            
            # Check for balanced patterns
            scores_list = [f["score"] for f in factors]
            if max(scores_list) - min(scores_list) <= 2:
                summary["balanced_factors"].append(section)
        
        return summary
    
    # def _generate_sections(self, context: Dict) -> Dict[str, Any]:
    #     """Generate all sections of the report using AI."""
        
    #     report = {
    #         "discovery_letter": self._generate_discovery_letter(context),
    #         "definitions": self._generate_definitions(context),
    #         "drives_profile": self._generate_drives_profile(context),
    #         "conditioning_profile": self._generate_conditioning_profile(context),
    #         "communication_profile": self._generate_communication_profile(context),
    #         "orientation_insights": self._generate_orientation_insights(context),
    #         "overall_observations": self._generate_overall_observations(context),
    #         "action_agenda": self._generate_action_agenda(context)
    #     }
        
    #     return report
    
    # def _generate_discovery_letter(self, context: Dict) -> str:
    #     """Generate personalized discovery letter."""
    #     prompt = f"""
    #     Write a personalized discovery letter for {context['candidate']['name']} based on their BRET assessment results.
        
    #     The letter should:
    #     1. Welcome them to their behavioral blueprint
    #     2. Invite introspection and reflection
    #     3. Encourage using insights for growth
    #     4. Reference their behavioral patterns briefly
        
    #     Keep the tone warm, professional, and encouraging. The letter should be 3-4 paragraphs.
        
    #     Their assessment context: {json.dumps(context['score_summary'], indent=2)}
    #     """
        
    #     response = self.client.chat.completions.create(
    #         model=self.model,
    #         messages=[
    #             {"role": "system", "content": "You are a professional behavioral assessment expert writing personalized discovery letters."},
    #             {"role": "user", "content": prompt}
    #         ],
    #         temperature=0.7,
    #         max_tokens=500
    #     )
        
    #     return response.choices[0].message.content
    
    # def _generate_drives_profile(self, context: Dict) -> Dict:
    #     """Generate the drives (Section A) profile."""
    #     # Extract section A scores
    #     section_a_scores = [
    #         s for s in context["scores"] 
    #         if s["section_name"] == "Natural-Motivator"
    #     ]
        
    #     if not section_a_scores:
    #         return {}
        
    #     # Generate composite insight
    #     composite_prompt = f"""
    #     Based on the following Drives scores, write a composite insight paragraph:
    #     {json.dumps(section_a_scores, indent=2)}
        
    #     The insight should be a reflective analysis of core motivations and behavioral drivers.
    #     Use a descriptive narrative style. For example: "You navigate life with a heart-led approach..."
    #     """
        
    #     composite_response = self.client.chat.completions.create(
    #         model=self.model,
    #         messages=[
    #             {"role": "system", "content": "You are a behavioral assessment expert writing composite insights."},
    #             {"role": "user", "content": composite_prompt}
    #         ],
    #         temperature=0.7,
    #         max_tokens=300
    #     )
        
    #     # Generate individual factor descriptions
    #     factor_descriptions = []
    #     for score in section_a_scores:
    #         score_label = self._get_score_label(score["score"])
    #         desc_prompt = f"""
    #         Write a brief, personalized description for someone with:
    #         - Factor: {score['factor_name']}
    #         - Score: {score['score']}/5 ({score_label})
            
    #         The description should be 2-3 sentences explaining what this means for their behavior and tendencies.
    #         Example: "You form deep bonds, are willing to sacrifice for loved ones, and view success as a path to emotional fulfillment."
    #         """
            
    #         desc_response = self.client.chat.completions.create(
    #             model=self.model,
    #             messages=[
    #                 {"role": "system", "content": "You are a behavioral assessment expert writing personalized factor descriptions."},
    #                 {"role": "user", "content": desc_prompt}
    #             ],
    #             temperature=0.6,
    #             max_tokens=150
    #         )
            
    #         factor_descriptions.append({
    #             "factor_name": score["factor_name"],
    #             "score": score["score"],
    #             "score_label": score_label,
    #             "description": desc_response.choices[0].message.content
    #         })
        
    #     return {
    #         "section_name": "Natural-Motivator",
    #         "section_code": "A",
    #         "composite_insight": composite_response.choices[0].message.content,
    #         "factors": factor_descriptions
    #     }
    
    def _generate_sections(self, context: Dict) -> Dict[str, Any]:
        """Generate all sections using the available methods."""
        
        # Extract section-specific data for the template method
        section_a = [s for s in context["scores"] if s["section_code"] == "A"]
        
        report = {
            # Using the completed methods that actually exist in the file:
            "drives_profile": self._generate_drives_profile_with_template(context, section_a),
            "conditioning_profile": self._generate_conditioning_profile(context),
            "communication_profile": self._generate_communication_profile(context),
            "orientation_insights": self._generate_orientation_insights(context),
            "overall_observations": self._generate_overall_observations(context),
            "action_agenda": self._generate_action_agenda(context)
        }
    
        return report


    def _generate_drives_definitions(self, context: Dict) -> List[Dict]:
        """Generate definition cards for drives section."""
        prompt = f"""
        Generate definition cards for the four Drives factors.
        
        For each drive, provide a brief definition that matches the style:
    
    Altruistic Drive: "A drive rooted in the intangible rewards of service..."
    Emotional Drive: "A drive that listens to the wisdom of the heart..."
    Power Drive: "A drive towards influence and tangible impact..."
    Existential Drive: "A grounding force centered on self-preservation..."
    
    Context: {json.dumps(context['scores'], indent=2)}
    
    Return as JSON array with fields: factor_name, definition
    """
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a behavioral assessment expert writing definitions."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=500,
            response_format={"type": "json_object"}
        )
    
        return json.loads(response.choices[0].message.content).get("definitions", [])

    def _generate_drives_profile_with_template(self, context: Dict, scores: List) -> Dict:
        """Generate drives profile with template-specific formatting."""
    
        # Composite insight
        composite_prompt = f"""
        Write a composite insight paragraph for the Drives Profile section.
        Format should match:
        "You navigate life with a heart-led approach, balancing deep empathy with practical boundaries..."
    
        Scores: {json.dumps(scores, indent=2)}
    
        The insight should be one paragraph, 2-3 sentences, starting with the person's name.
        """
    
        # Individual factor descriptions with score labels
        factor_prompts = []
        for score in scores:
            label = self._get_score_label(score["score"])
            factor_prompts.append(f"""
            For {score['factor_name']} ({label}), write a 2-3 sentence description matching this style:
        
            Altruistic (Moderate): "Reflective helper with clear boundaries. You support causes but may not initiate..."
            Emotional (Strong): "Heart-led decision making. You form deep bonds, are willing to sacrifice..."
            Power (Moderate): "Purposeful influence. You seek authority only when confident in your capability..."
            Existential (Moderate): "Grounded self-preservation. You prioritize stability and only share resources..."
            """)
    
        # Generate responses
        composite_response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a behavioral assessment expert."},
                {"role": "user", "content": composite_prompt}
            ],
            temperature=0.7,
            max_tokens=200
        )
    
        factor_responses = []
        for prompt in factor_prompts:
            resp = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a behavioral assessment expert."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.6,
                max_tokens=150
            )
            factor_responses.append(resp.choices[0].message.content)
    
        return {
            "section_code": "A",
            "section_name": "Drives Profile",
            "composite_insight": composite_response.choices[0].message.content,
            "factors": [
                {
                    "factor_name": scores[i]["factor_name"],
                    "score": scores[i]["score"],
                    "score_label": self._get_score_label(scores[i]["score"]),
                    "description": factor_responses[i] if i < len(factor_responses) else ""
                }
                for i in range(len(scores))
            ]
        }

    def _generate_conditioning_profile(self, context: Dict) -> Dict:
        """Generate the conditioning (Section B) profile."""
        section_b_scores = [
            s for s in context["scores"] 
            if s["section_name"] == "Conditioned"
        ]
        
        if not section_b_scores:
            return {}
        
        # Generate composite insight
        composite_prompt = f"""
        Based on the following Conditioning scores, write a composite insight paragraph:
        {json.dumps(section_b_scores, indent=2)}
        
        The insight should describe how the individual adapts to change and new environments.
        For example: "A Cautious Validator — You approach change through the lens of data and reliability..."
        """
        
        composite_response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a behavioral assessment expert writing composite insights about change orientation."},
                {"role": "user", "content": composite_prompt}
            ],
            temperature=0.7,
            max_tokens=300
        )
        
        # Generate individual factor descriptions
        factor_descriptions = []
        for score in section_b_scores:
            score_label = self._get_score_label(score["score"])
            desc_prompt = f"""
            Write a brief, personalized description for someone with:
            - Factor: {score['factor_name']}
            - Score: {score['score']}/5 ({score_label})
            
            The description should be 2-3 sentences explaining their approach to change and adaptability.
            Example: "You seek validation before accepting new ideas. You prefer well-defined processes and stability..."
            """
            
            desc_response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a behavioral assessment expert writing personalized factor descriptions about change."},
                    {"role": "user", "content": desc_prompt}
                ],
                temperature=0.5,
                max_tokens=60
            )
            
            factor_descriptions.append({
                "factor_name": score["factor_name"],
                "score": score["score"],
                "score_label": score_label,
                "description": desc_response.choices[0].message.content
            })
        
        return {
            "section_name": "Conditioned",
            "section_code": "B",
            "composite_insight": composite_response.choices[0].message.content,
            "factors": factor_descriptions
        }
    
    def _generate_communication_profile(self, context: Dict) -> Dict:
        """Generate the communication (Section C) profile."""
        section_c_scores = [
            s for s in context["scores"] 
            if s["section_name"] == "Learned"
        ]
        
        if not section_c_scores:
            return {}
        
        # Generate composite insight
        composite_prompt = f"""
        Based on the following Communication scores, write a composite insight paragraph:
        {json.dumps(section_c_scores, indent=2)}
        
        The insight should describe their acquired communication style and how they connect and influence others.
        For example: "A Mindful Communicator — You are structured and fair, providing clear guidance..."
        """
        
        composite_response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a behavioral assessment expert writing composite insights about communication style."},
                {"role": "user", "content": composite_prompt}
            ],
            temperature=0.7,
            max_tokens=250
        )
        
        # Generate individual factor descriptions
        factor_descriptions = []
        for score in section_c_scores:
            score_label = self._get_score_label(score["score"])
            desc_prompt = f"""
            Write a brief, personalized description for someone with:
            - Factor: {score['factor_name']}
            - Score: {score['score']}/5 ({score_label})
            
            The description should be 2-3 sentences explaining their communication tendencies.
            Example: "You manage emotions well, choosing when to display them. This allows for balanced arguments..."
            """
            
            desc_response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a behavioral assessment expert writing personalized factor descriptions about communication."},
                    {"role": "user", "content": desc_prompt}
                ],
                temperature=0.5,
                max_tokens=60
            )
            
            factor_descriptions.append({
                "factor_name": score["factor_name"],
                "score": score["score"],
                "score_label": score_label,
                "description": desc_response.choices[0].message.content
            })
        
        return {
            "section_name": "Learned",
            "section_code": "C",
            "composite_insight": composite_response.choices[0].message.content,
            "factors": factor_descriptions
        }
    
    def _generate_orientation_insights(self, context: Dict) -> Dict[str, str]:
        """Generate orientation insights (Leadership, Team, Motivation, etc.)."""
        
        # Extract scores for all sections
        all_scores = context["scores"]
        
        orientation_prompt = f"""
        Based on the following assessment scores, provide insights for:
        
        1. Leadership Orientation
        2. Team Orientation
        3. Motivation Orientation
        4. Change Orientation
        5. Stress Orientation
        
        Scores: {json.dumps(all_scores, indent=2)}
        
        For each orientation, write 2-3 sentences describing their style or approach.
        Examples:
        - Leadership: "Given's altruistic orientation and focus on stakeholder welfare align with servant leadership..."
        - Team: "Given benefits from and promotes collaboration, inviting input and shared ownership..."
        
        Format as JSON with keys: leadership, team, motivation, change, stress
        """
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a behavioral assessment expert providing orientation insights."},
                {"role": "user", "content": orientation_prompt}
            ],
            temperature=0.7,
            max_tokens=300,
            response_format={"type": "json_object"}
        )
        
        try:
            return json.loads(response.choices[0].message.content)
        except:
            # Fallback if JSON parsing fails
            return {
                "leadership": "Demonstrates balanced leadership approach.",
                "team": "Collaborative team orientation.",
                "motivation": "Driven by meaningful objectives.",
                "change": "Adaptable to change.",
                "stress": "Manages stress effectively."
            }
    
    def _generate_overall_observations(self, context: Dict) -> Dict:
        """Generate overall observations and key takeaways."""
        
        all_scores = context["scores"]
        summary = context["score_summary"]
        
        prompt = f"""
        Based on this assessment data, generate overall observations and key takeaways.
        
        Scores: {json.dumps(all_scores, indent=2)}
        Pattern Summary: {json.dumps(summary, indent=2)}
        
        Provide:
        1. Integrated Behavioral Pattern - One paragraph synthesizing their overall profile
        2. Key Takeaways - 4-6 bullet points with actionable insights
        
        Format as JSON with keys: "integrated_pattern" (string), "key_takeaways" (list of strings)
        """
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a behavioral assessment expert providing overall observations."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500,
            response_format={"type": "json_object"}
        )
        
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {
                "integrated_pattern": "Balanced behavioral pattern with diverse strengths.",
                "key_takeaways": [
                    "Leverage your highest-scoring factors in your leadership approach.",
                    "Consider developing lower-scoring areas for more balanced performance.",
                    "Use your strengths to influence and inspire others.",
                    "Create an intentional development plan to maximize your potential."
                ]
            }
    
    def _generate_action_agenda(self, context: Dict) -> Dict:
        """Generate action agenda/IDP."""
        
        all_scores = context["scores"]
        
        prompt = f"""
        Based on the assessment results, create a development agenda (IDP) with:
        
        Scores: {json.dumps(all_scores, indent=2)}
        
        Provide:
        1. Focus Areas - Key development priorities (3-5 items)
        2. 90-Day Roadmap - Specific actions for 30, 60, and 90 days
        3. SSC Framework - START, STOP, CONTINUE (actions to start doing, stop doing, continue doing)
        
        Format as JSON with keys: "focus_areas" (list), "roadmap" (dict with 30/60/90), "ssc" (dict with start/stop/continue)
        """
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a behavioral assessment expert creating development agendas."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=600,
            response_format={"type": "json_object"}
        )
        
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {
                "focus_areas": ["Leverage strengths", "Develop weaker areas"],
                "roadmap": {
                    "30": "Reflect on assessment results",
                    "60": "Apply insights in daily interactions",
                    "90": "Review progress and adjust"
                },
                "ssc": {
                    "start": "Practice intentional behavior",
                    "stop": "Avoid automatic reactions",
                    "continue": "Build on strengths"
                }
            }
    
    def _get_score_label(self, score: int) -> str:
        """Convert numeric score to label."""
        labels = {
            5: "Very Strong",
            4: "Strong",
            3: "Moderate",
            2: "Mild",
            1: "Weak",
            0: "Absence"
        }
        return labels.get(score, "Moderate")