from fastapi import FastAPI, HTTPException
from models.game import Board

app = FastAPI(title="Connect Four")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

@app.post("/evaluate_board_state")
def evaluate_board_state(board: Board) -> dict:
    try:
        return {"board": board.get_status()}
    except ValueError as error:
        print(error)
        raise HTTPException(status_code=422, detail=str(error))
