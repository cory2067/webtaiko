package main

import (
	"html/template"
	"fmt"
	"github.com/gorilla/mux"
	"net/http"
)

func main() {
	fmt.Println("Starting server")

	// Serve static files at /static
	fs := http.FileServer(http.Dir("static/"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	r := mux.NewRouter()
	r.HandleFunc("/map/{title}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		title := vars["title"]

		fmt.Fprintf(w, "You've requested the map: %s\n", title)
	})

    tmpl := template.Must(template.ParseFiles("index.html"))
	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        tmpl.Execute(w, nil)
	})

	http.ListenAndServe(":8000", r)
}
