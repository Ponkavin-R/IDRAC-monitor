from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import servers

app = FastAPI(title="Dell iDRAC Monitoring API")

# Define the origins (domains) that are allowed to make requests
origins = [
    "http://localhost",
    "http://localhost:5173",  # This is the origin of your Vite frontend
]

# Add the CORS middleware to your application
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # List of allowed origins
    allow_credentials=True, # Allow cookies and authentication headers
    allow_methods=["*"],    # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],    # Allow all headers
)

# Include server routes
app.include_router(servers.router)

@app.get("/")
def root():
    return {"message": "Dell iDRAC Monitoring API running"}
