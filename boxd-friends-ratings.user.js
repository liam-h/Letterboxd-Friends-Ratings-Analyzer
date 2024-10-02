// ==UserScript==
// @name         Letterboxd Friend Ratings Analyzer
// @namespace    http://tampermonkey.net/
// @version      3.2.1
// @description  Analyze ratings from friends on Letterboxd, including paginated ratings, and show a histogram below the global one.
// @author       https://github.com/liam-h
// @match        https://letterboxd.com/film/*
// @grant        none
// @license      GPLv3
// @run-at       document-end
// @downloadURL https://update.greasyfork.org/scripts/509173/Letterboxd%20Friend%20Ratings%20Analyzer.user.js
// @updateURL https://update.greasyfork.org/scripts/509173/Letterboxd%20Friend%20Ratings%20Analyzer.meta.js
// ==/UserScript==

const username = "YOUR_USERNAME_HERE";

// Fetch all ratings, including paginated pages
const fetchAllRatings = (user, film) => {
    let page = 1;
    const allRatings = [];

    return (function fetchPage() {
        return fetchRatingsPage(user, film, page).then(ratingsFromPage => {
            allRatings.push(...ratingsFromPage);
            if (ratingsFromPage.length > 0) {
                page++;
                return fetchPage();
            }
            return allRatings;
        });
    })();
};

// Fetch ratings from a single page as a one-liner
const fetchRatingsPage = (user, film, page) =>
    fetch(`https://letterboxd.com/${user}/friends/film/${film}/rated/.5-5/page/${page}`)
        .then(response => response.text())
        .then(html => Array.from(new DOMParser().parseFromString(html, 'text/html').querySelectorAll('.person-table.film-table tbody tr'))
            .map(row => {
                const ratingClass = [...row.querySelector('.film-detail-meta .rating').classList]
                    .find(cls => cls.startsWith('rated-'));
                return ratingClass ? parseFloat(ratingClass.replace('rated-', '')) / 2 : null;
            }).filter(Boolean)
        );

// Construct the friends' rating histogram with links
const constructHistogram = (ratings, user, film) => {
    const bins = Array(10).fill(0);
    ratings.forEach(rating => bins[Math.floor((rating - 0.5) * 2)]++);
    const maxCount = Math.max(...bins);

    return `
        <section class="section ratings-histogram-chart">
            <div class="rating-histogram rating-histogram-exploded">
                <span class="rating-green rating-green-tiny rating-1"><span class="rating rated-2">★</span></span>
                <ul>
                    ${bins.map((count, index) => {
                        const stars = ((index / 2) + 0.5).toFixed(1);
                        const ratingLink = `/${user}/friends/film/${film}/rated/${stars}/`;
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

// Place histogram below the global one, adding links
const placeHistogram = (histogramHtml, averageRating, user, film, count) => {
    const globalHistogramSection = document.querySelector('.ratings-histogram-chart');
    if (globalHistogramSection) {
        const friendsRatingsLink = `/${user}/friends/film/${film}/rated/.5-5/`;
        const friendsHistogramSection = document.createElement('section');
        friendsHistogramSection.classList.add('section', 'ratings-histogram-chart');
        friendsHistogramSection.innerHTML = `
            <h2 class="section-heading">
                <a href="${friendsRatingsLink}">Ratings from friends</a>
                <span class="average-rating">
                    <a href="${friendsRatingsLink}" title="${count} ratings">
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
fetchAllRatings(username, film = window.location.href.split('/').slice(-2, -1)[0])
    .then(ratings => {
        if (ratings.length) {
            const averageRating = (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1);
            placeHistogram(constructHistogram(ratings, username, film), averageRating, username, film, ratings.length);
        }
    });
