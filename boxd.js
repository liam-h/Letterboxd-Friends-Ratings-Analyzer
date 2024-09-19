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

// Define sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Function to get the list of elements
  function getList() {
    return document.querySelectorAll(".activity-from-friends > .avatar-list > .listitem");
  }
  
  // Function to repeatedly check for the list
  async function finalList() {
    let list;
    while ((list = getList()).length === 0) {
      await sleep(100);
    }
    return list;
  }
  
  // Function to parse rating text and convert it to a fractional number
  function parseRating(ratingText) {
    ratingText = ratingText.trim().replace("★", "★ ").replace("½", "½").trim();
    let count = (ratingText.match(/★/g) || []).length;
    let halfStar = ratingText.includes("½");
    return count + (halfStar ? 0.5 : 0);
  }
  
  // Function to get ratings from the list
  function getRatings(list) {
    let ratings = [];
    list.forEach(item => {
      let ratingElement = item.querySelector(".rating");
      if (ratingElement) {
        let ratingText = ratingElement.textContent.trim();
        let rating = parseRating(ratingText);
        if (rating > 0) {
          ratings.push(rating);
        }
      }
    });
    return ratings;
  }
  
  // Function to calculate the average rating
  function calculateAverage(ratings) {
    if (ratings.length === 0) return 0;
    let sum = ratings.reduce((total, rating) => total + rating, 0);
    return (sum / ratings.length).toFixed(1); // Average rounded to one decimal place
  }
  
  // Main function to execute after list is available
  async function main() {
    const list = await finalList();
    const ratings = getRatings(list);
  
    if (ratings.length > 0) {
      const averageRating = calculateAverage(ratings);
      const header = document.querySelector(".activity-from-friends > h2.section-heading > a");
      if (header) {
        header.innerHTML += " • Average rating: " + averageRating;
      }
    }
  }
  
  // Execute the main function
  main();
