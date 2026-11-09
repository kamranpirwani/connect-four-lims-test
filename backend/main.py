from fastapi import FastAPI

app = FastAPI(title="Connect Four")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


# TODO: add POST /evaluate_board_state (see the README).
