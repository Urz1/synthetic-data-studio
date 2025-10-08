from fastapi import FastAPI

app = FastAPI(title="Synthetic Data Studio - Backend")


@app.get("/")
def read_root():
    return {"message": "Synthetic Data Studio backend is running."}
