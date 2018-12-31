package main

import (
	"html/template"
	"fmt"
	"github.com/gorilla/mux"
	"net/http"
)

func main() {
	fmt.Println("Starting server")
	r := mux.NewRouter()

    // Serve static files at /static
	fs := http.FileServer(http.Dir("web/static"))
	r.PathPrefix("/static").Handler(http.StripPrefix("/static/", fs))

    tmpl := template.Must(template.ParseFiles("web/templates/index.html"))
	r.HandleFunc("/play/{mapId}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		mapId := vars["mapId"]

        tmpl.Execute(w, mapId)
	})

	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "home page");
        // tmpl.Execute(w, nil)
	})

	http.ListenAndServe(":8000", r)
}
