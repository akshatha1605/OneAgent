from fastapi import FastAPI

app = FastAPI(
    title="OneAgent API",
    version="1.0.0",
    description="Intelligent Multi-Agent AI Orchestration Platform"
)

@app.get("/")
async def root():
    return {
        "message": "Welcome to OneAgent 🚀"
    }