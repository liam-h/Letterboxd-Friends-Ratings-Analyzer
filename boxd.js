// ==UserScript==
// @name         Letterboxd Friend Ratings Analyzer
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Analyze ratings from friends on Letterboxd
// @author       https://github.com/liam-h
// @match        https://letterboxd.com/film/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

// Sleep function
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Get list of elements
const getList = () => document.querySelectorAll(".activity-from-friends > .avatar-list > .listitem");

// Attempt to get list until populated
const finalList = async () => {
    let list;
    while (!(list = getList()).length) await sleep(100);
    return list;
};

// Parse rating text
const parseRating = ratingText => {
    if (!ratingText) return 0;
    const trimmedText = ratingText.trim().replace("★", "★ ");
    const count = (trimmedText.match(/★/g) || []).length;
    return count + (trimmedText.includes("½") ? 0.5 : 0);
};

// Get ratings from the list
const getRatings = list => Array.from(list)
    .map(item => item.querySelector(".rating")?.textContent)
    .map(parseRating)
    .filter(rating => rating > 0);

// Calculate average rating
const calculateAverage = ratings => {
    if (!ratings.length) return 0;
    const sum = ratings.reduce((total, rating) => total + rating, 0);
    return (sum / ratings.length).toFixed(1);
};

// Main function
const main = async () => {
    const list = await finalList();
    const ratings = getRatings(list);
    if (ratings.length) {
        const averageRating = calculateAverage(ratings);
        const header = document.querySelector(".activity-from-friends > h2.section-heading > a");
        if (header) header.innerHTML += ` • Average rating: ${averageRating}`;
    }
};

main();
