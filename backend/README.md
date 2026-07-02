# 🚆 Marg-Manthan

> A fast and efficient railway route search engine for Indian Railways.

Marg-Manthan is a railway route planning system that enables users to search for trains, explore routes between stations, and efficiently query railway timetable data. The project preprocesses raw IRCTC timetable data into optimized data structures to ensure fast and scalable route searches.

---

## ✨ Features

- 🔍 Search trains between two stations
- 🚉 View complete train routes
- 📍 Station-wise train lookup
- 🔄 Discover direct and connecting routes
- ⚡ Fast query execution using preprocessed data
- 📊 Efficient handling of large railway datasets
- 💾 Optimized storage and indexing

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| Language | Python |
| Backend | Flask / FastAPI |
| Data Processing | Pandas |
| Data Storage | JSON, CSV |
| Graph Processing | NetworkX (Optional) |
| Frontend | HTML, CSS, JavaScript |

---

## 📂 Project Structure

```text
Marg-Manthan/
│
├── data/
│   ├── raw/
│   └── processed/
│
├── scripts/
│   ├── preprocess.py
│   └── build_graph.py
│
├── backend/
│   ├── api.py
│   ├── search.py
│   └── graph.py
│
├── frontend/
│
├── utils/
│
├── README.md
└── requirements.txt
```

---

## ⚙️ How It Works

1. Load raw railway timetable data.
2. Preprocess and clean the dataset.
3. Build optimized graph and index structures.
4. Store processed data.
5. Accept user search queries.
6. Return the best possible train routes.

---

## 🧠 Algorithms Used

- Graph Traversal
- Breadth First Search (BFS)
- Dijkstra's Algorithm
- Hash Maps
- Adjacency Lists
- Indexed Station Lookup

---

## 📊 Dataset

The dataset contains railway timetable information including:

- Train Number
- Train Name
- Station Code
- Station Name
- Arrival Time
- Departure Time
- Distance
- Stop Sequence

---

## 🚀 Installation

### Clone the repository

```bash
git clone https://github.com/yourusername/Marg-Manthan.git
cd Marg-Manthan
```

### Install dependencies

```bash
pip install -r requirements.txt
```

### Preprocess the dataset

```bash
python scripts/preprocess.py
```

### Start the server

```bash
python backend/api.py
```

---

## 📸 Screenshots

- To be updated

---

## 🎯 Future Improvements

- Live train status
- Seat availability
- Fare prediction
- Delay prediction
- Platform prediction
- Interactive railway map
- AI-powered route recommendations
- Real-time train tracking
- Multilingual support

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature-name
```

3. Commit your changes

```bash
git commit -m "Add new feature"
```

4. Push the branch

```bash
git push origin feature-name
```

5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Authors

Developed as part of a Railway Route Search Engine project.

---

## ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub!