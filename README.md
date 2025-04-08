# AlphaPlanMVP - Course Scheduling Application

![Project Banner](https://via.placeholder.com/1200x400?text=AlphaPlanMVP+Screenshot)

A modern course scheduling application built with Next.js frontend and Flask backend, designed to help students plan their academic schedules efficiently.

https://classes.rutgers.edu/soc/api/courses.json?year=2024&term=9&campus=NB

## Features

- 📅 Interactive course scheduling with drag-and-drop interface
- 🔍 Course search with filters for departments, professors, and times
- 👥 Social features: Share schedules with friends
- 📱 Mobile-responsive design
- 🔒 Google OAuth authentication
- 📊 Course difficulty ratings and professor reviews

## Tech Stack

**Frontend:** 
- Next.js 14
- TypeScript
- Tailwind CSS
- Radix UI

**Backend:** 
- Python 3.10
- Flask
- SQLAlchemy
- PostgreSQL/SQLite

**DevOps:**
- Docker
- Azure Web Apps
- Azure PostgreSQL

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL (optional for development)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/alphaplanmvp.git
cd alphaplanmvp
```

2. **Frontend Setup**
```bash
cd frontend
npm install
```

3. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/MacOS
.\venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

### Configuration

Create `.env` file in backend directory:
```env
SECRET_KEY=your_secret_key
DATABASE_URL=sqlite:///app.db  # For local development
# DATABASE_URL=postgresql://user:password@localhost/dbname
```

### Running Locally

1. **Start Backend**
```bash
cd backend
flask db upgrade
flask run
```

2. **Start Frontend**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Deployment

The application is configured for deployment to Azure App Service. See the `azure-pipelines.yml` for CI/CD configuration.

### Production Environment Variables
```env
DATABASE_URL=<Azure PostgreSQL Connection String>
JWT_SECRET_KEY=<Strong Secret Key>
GOOGLE_CLIENT_ID=<Your Google OAuth ID>
GOOGLE_CLIENT_SECRET=<Your Google OAuth Secret>
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License
private

run `python rate/create_csv.py` to convert json of rate my data to csv

For scraper https://classes.rutgers.edu/soc/api/openSections.json?year=2025&term=9&campus=NB