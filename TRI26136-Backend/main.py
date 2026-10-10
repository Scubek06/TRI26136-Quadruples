
from fastapi import FastAPI

app = FastAPI(
    title="DataPilot AI API",
    description="Backend API for DataPilot AI",
    version="0.1.0",
)


@app.get("/")
def root():
    return {
        "message": "Welcome to DataPilot AI API",
        "status": "running",
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "DataPilot AI API",
    }
