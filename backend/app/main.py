
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import questions, behavioural_types, behavioural_factors, forms, duplicates, users, sessions, auth, audit

app = FastAPI(title="BRET Assessment API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(forms.router)
app.include_router(behavioural_types.router)
app.include_router(behavioural_factors.router)
app.include_router(questions.router)
app.include_router(duplicates.router)
app.include_router(users.router)
app.include_router(sessions.router)
app.include_router(audit.router)

@app.get("/")
def root():
    return {"status": "ok"}

@app.middleware("http")
async def add_no_store_headers(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response