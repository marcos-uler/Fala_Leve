
from fastapi import FastAPI
 
from routes import metodo_pagamento, psicologo
 
app = FastAPI(title="Fala Leve API")
 
app.include_router(psicologo.router)
app.include_router(metodo_pagamento.router)
 
 
@app.get("/")
def raiz():
    return {"status": "API Fala Leve no ar"}
 