// ==UserScript==
// @name         Letterboxd Friend Ratings Analyzer
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Analyze ratings from friends on Letterboxd and show a histogram below the global one.
// @author       https://github.com/liam-h
// @match        https://letterboxd.com/film/*
// @grant        none
// @license      GPLv3
// @run-at       document-end
// ==/UserScript==

// Sleep function
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Get friend ratings
const getRatings = async () => {
    let list;
    while (!(list = document.querySelectorAll(".activity-from-friends > .avatar-list > .listitem")).length) await sleep(100);
    return Array.from(list)
        .map(item => item.querySelector(".rating")?.textContent?.trim().replace("★", "★ "))
        .map(rating => {
            const count = (rating?.match(/★/g) || []).length;
            return count + (rating?.includes("½") ? 0.5 : 0);
        })
        .filter(rating => rating > 0);
};

// Calculate average rating for friends
const calculateAverage = ratings => (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1);

// Extract username and film name from the URL
const extractUserAndFilm = () => {
    const linkElement = document.querySelector('.activity-from-friends > h2 > a');
    if (linkElement) {
        const urlParts = linkElement.href.split('/');
        const username = urlParts[3];
        const film = urlParts[urlParts.length - 2];
        return { username, film };
    }
    return {};
};

// Construct the friends' rating histogram with links
const constructHistogram = (ratings, user, film) => {
    const bins = Array(10).fill(0);
    ratings.forEach(rating => bins[Math.round((rating - 0.5) * 2)]++);

    const maxCount = Math.max(...bins);
    return `
        <section class="section ratings-histogram-chart">
            <div class="rating-histogram rating-histogram-exploded">
                <span class="rating-green rating-green-tiny rating-1"><span class="rating rated-2">★</span></span>
                <ul>
                    ${bins.map((count, index) => {
                        const stars = (index % 2 === 0 ? index / 2 : index / 2 + 0.5).toFixed(1);
                        const ratingLink = `https://letterboxd.com/${user}/friends/film/${film}/rated/${stars}/`;
                        const barHtml = `<i style="height: ${(maxCount ? (count / maxCount) * 44 : 1)}px;"></i>`;
                        return `
                            <li class="rating-histogram-bar" style="width: 15px; left: ${index * 16}px">
                                ${count > 0
                                    ? `<a href="${ratingLink}" class="ir tooltip" title="${count} ratings">${stars}★ ${barHtml}</a>`
                                    : `${stars}★ ${barHtml}`}
                            </li>
                        `;
                    }).join('')}
                </ul>
                <span class="rating-green rating-green-tiny rating-5"><span class="rating rated-10">★★★★★</span></span>
            </div>
        </section>
    `;
};

// Place histogram below the global one, adding links for all friends' ratings
const placeHistogram = (histogramHtml, averageRating, user, film) => {
    const globalHistogramSection = document.querySelector('.ratings-histogram-chart');
    if (globalHistogramSection) {
        const friendsRatingsLink = `https://letterboxd.com/${user}/friends/film/${film}/rated/.5-5/`;
        const friendsHistogramSection = document.createElement('section');
        friendsHistogramSection.classList.add('section', 'ratings-histogram-chart');
        friendsHistogramSection.innerHTML = `
            <h2 class="section-heading">
                <a href="${friendsRatingsLink}">Friends' Ratings</a>
                <span class="average-rating">
                    <a href="${friendsRatingsLink}">
                        <span class="display-rating">${averageRating}</span>
                    </a>
                </span>
            </h2>
            ${histogramHtml}
        `;
        globalHistogramSection.parentNode.insertBefore(friendsHistogramSection, globalHistogramSection.nextSibling);
    }
};

// Main function to run the script
(async () => {
    const ratings = await getRatings();
    if (ratings.length) {
        const averageRating = calculateAverage(ratings);
        const { username, film } = extractUserAndFilm();

        if (username && film) {
            const histogramHtml = constructHistogram(ratings, username, film);
            placeHistogram(histogramHtml, averageRating, username, film);
        }
    }
})();
