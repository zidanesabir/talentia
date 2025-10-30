"""Test MongoDB connection"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test_connection():
    try:
        # Try to connect to MongoDB
        client = AsyncIOMotorClient("mongodb://localhost:27017/talentia", serverSelectionTimeoutMS=5000)
        
        # Test the connection
        await client.admin.command('ping')
        print("✅ MongoDB connection successful!")
        
        # List databases
        db_list = await client.list_database_names()
        print(f"📚 Available databases: {db_list}")
        
        # Check talentia database
        db = client.get_default_database()
        collections = await db.list_collection_names()
        print(f"📁 Collections in talentia database: {collections}")
        
        client.close()
        
    except Exception as e:
        print(f"❌ MongoDB connection failed!")
        print(f"Error: {type(e).__name__}: {str(e)}")
        print("\n💡 Solution: You need to install and start MongoDB")
        print("   Option 1: Install MongoDB locally from https://www.mongodb.com/try/download/community")
        print("   Option 2: Use MongoDB Atlas (cloud) from https://www.mongodb.com/cloud/atlas")

if __name__ == "__main__":
    asyncio.run(test_connection())

