# Letterboxd-Friends-Ratings-Analyzer
Shows the average rating given by your Letterboxd friends. No jQuery, no bs.

TODO: solve weird padding issue under avg rating number. Idk why it looks like that

What it looks like currently:

![Screenshot](https://github.com/liam-h/Letterboxd-Friends-Ratings-Analyzer/blob/main/script.png?raw=true)

Note that since I parse the ratings using DOM only, the average will be calculated using only the ratings that appear in the random 13-ish number of your followers that Letterboxd fetches. Getting all friends would require reworking the script quite extensively, which I'm currently not interested in doing. Sorry!
