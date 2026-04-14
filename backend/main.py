from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from database import engine
import models
from routers.auth import router as auth_router
from routers.courses import router as courses_router
from routers.comments import router as comments_router
from routers.fun_facts import router as fun_facts_router
from routers.fun_fact_tags import router as fun_fact_tags_router
from routers.hour_packages import router as hour_packages_router

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
app.include_router(comments_router, prefix="/comments", tags=["Comments"])
app.include_router(fun_facts_router, prefix="/fun-facts", tags=["Fun Facts"])
app.include_router(fun_fact_tags_router, prefix="/fun-fact-tags", tags=["Fun Fact Tags"])
app.include_router(hour_packages_router, prefix="/hour-packages", tags=["Hour Packages"])

@app.get("/")
async def read_root():
    return {"message": "Bem-vindo à API"}