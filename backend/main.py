from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models
from routers.auth import router as auth_router
from routers.courses import router as courses_router

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Portuguese Academy API")

origins = [
    "http://localhost:5173",  
    "http://localhost:3000", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Autenticação"])
app.include_router(courses_router, prefix="/courses", tags=["Cursos"])

@app.get("/")
async def read_root():
    return {"message": "Bem-vindo à API"}
t