#!flask/bin/python
from flask import Flask
import codecs

app = Flask(__name__)

def get_file_content(file_name):
    file_object = codecs.open(file_name, "r", "utf-8")
    try:
        all_the_text = file_object.read( )
    finally:
        file_object.close( )
    return all_the_text


@app.route('/')
def index():
    return get_file_content("static/html/appBase.html")


@app.route('/applist/<cat>')
def applist(cat):
    return get_file_content("app/applist.json")


@app.route('/appdetail/<appId>')
def appdetail(appId):
    return get_file_content("app/appdetail.json")

if __name__ == '__main__':
    app.run(debug = True)
