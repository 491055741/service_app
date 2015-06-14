#!flask/bin/python
from flask import Flask
from flask import request
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
    return get_file_content("static/appBase.html")

# @app.route('/static/json/ads.json')
# def ads():
#     return get_file_content("static/json/ads.json")

@app.route('/applist')
def applist():
    return get_file_content("app/applist.json")

@app.route('/appdetail')
def appdetail():
    appid=request.args.get('appid',0)
    return get_file_content("app/appdetail"+appid+".json")

@app.route('/appverifycode')
def verifycode():
    return get_file_content("app/success.json")

@app.route('/appregister')
def register():
    return get_file_content("app/success.json")

@app.route('/applogin')
def login():
    return get_file_content("app/login.json")

if __name__ == '__main__':
    app.run(debug = True)
