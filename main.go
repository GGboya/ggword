package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

type Word struct {
	ID            int       `json:"id"`
	English       string    `json:"english"`
	Chinese       string    `json:"chinese"`
	Pronunciation string    `json:"pronunciation,omitempty"`
	Example       string    `json:"example,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	ReviewCount   int       `json:"review_count"`
	Difficulty    int       `json:"difficulty"` // 1-5 难度等级
}

type WordManager struct {
	words    []Word
	filename string
	nextID   int
}

func NewWordManager(filename string) *WordManager {
	wm := &WordManager{
		words:    []Word{},
		filename: filename,
		nextID:   1,
	}
	wm.loadWords()
	return wm
}

func (wm *WordManager) loadWords() {
	if _, err := os.Stat(wm.filename); os.IsNotExist(err) {
		// 文件不存在，创建示例数据
		wm.words = []Word{
			{
				ID:            1,
				English:       "Hello",
				Chinese:       "你好",
				Pronunciation: "/həˈloʊ/",
				Example:       "Hello, how are you?",
				CreatedAt:     time.Now(),
				ReviewCount:   0,
				Difficulty:    1,
			},
			{
				ID:            2,
				English:       "World",
				Chinese:       "世界",
				Pronunciation: "/wɜːrld/",
				Example:       "Welcome to the world of programming.",
				CreatedAt:     time.Now(),
				ReviewCount:   0,
				Difficulty:    2,
			},
		}
		wm.nextID = 3
		wm.saveWords()
		return
	}

	data, err := ioutil.ReadFile(wm.filename)
	if err != nil {
		log.Printf("Error reading file: %v", err)
		return
	}

	if err := json.Unmarshal(data, &wm.words); err != nil {
		log.Printf("Error unmarshaling JSON: %v", err)
		return
	}

	// 设置下一个ID
	for _, word := range wm.words {
		if word.ID >= wm.nextID {
			wm.nextID = word.ID + 1
		}
	}
}

func (wm *WordManager) saveWords() {
	data, err := json.MarshalIndent(wm.words, "", "  ")
	if err != nil {
		log.Printf("Error marshaling JSON: %v", err)
		return
	}

	if err := ioutil.WriteFile(wm.filename, data, 0644); err != nil {
		log.Printf("Error writing file: %v", err)
	}
}

func (wm *WordManager) getAllWords(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(wm.words)
}

func (wm *WordManager) addWord(w http.ResponseWriter, r *http.Request) {
	var newWord Word
	if err := json.NewDecoder(r.Body).Decode(&newWord); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	newWord.ID = wm.nextID
	newWord.CreatedAt = time.Now()
	newWord.ReviewCount = 0

	wm.words = append(wm.words, newWord)
	wm.nextID++
	wm.saveWords()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(newWord)
}

func (wm *WordManager) updateWord(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var updatedWord Word
	if err := json.NewDecoder(r.Body).Decode(&updatedWord); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	for i, word := range wm.words {
		if word.ID == id {
			updatedWord.ID = id
			updatedWord.CreatedAt = word.CreatedAt
			wm.words[i] = updatedWord
			wm.saveWords()

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(updatedWord)
			return
		}
	}

	http.Error(w, "Word not found", http.StatusNotFound)
}

func (wm *WordManager) deleteWord(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	for i, word := range wm.words {
		if word.ID == id {
			wm.words = append(wm.words[:i], wm.words[i+1:]...)
			wm.saveWords()
			w.WriteHeader(http.StatusNoContent)
			return
		}
	}

	http.Error(w, "Word not found", http.StatusNotFound)
}

func (wm *WordManager) reviewWord(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	for i, word := range wm.words {
		if word.ID == id {
			wm.words[i].ReviewCount++
			wm.saveWords()

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(wm.words[i])
			return
		}
	}

	http.Error(w, "Word not found", http.StatusNotFound)
}

func main() {
	wordManager := NewWordManager("words.json")

	r := mux.NewRouter()

	// API 路由
	api := r.PathPrefix("/api").Subrouter()
	api.HandleFunc("/words", wordManager.getAllWords).Methods("GET")
	api.HandleFunc("/words", wordManager.addWord).Methods("POST")
	api.HandleFunc("/words/{id:[0-9]+}", wordManager.updateWord).Methods("PUT")
	api.HandleFunc("/words/{id:[0-9]+}", wordManager.deleteWord).Methods("DELETE")
	api.HandleFunc("/words/{id:[0-9]+}/review", wordManager.reviewWord).Methods("POST")

	// 静态文件服务
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("./static/")))

	// 配置CORS
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"*"},
	})

	handler := c.Handler(r)

	fmt.Println("Server starting on :8080")
	fmt.Println("Visit http://localhost:8080 to access the app")
	log.Fatal(http.ListenAndServe(":8080", handler))
}
