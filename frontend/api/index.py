from fastapi import FastAPI
from .main import app as fastapi_app

# Vercel環境で /api 以下のアクセスを処理するためのラッパー
app = fastapi_app
