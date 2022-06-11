MutationObserver = window.MutationObserver;
let debounceTimeout = null;
const MUTATION_TIMEOUT = 150; // ms
const ANON_INFO_REGEX = /\((.*) to classmates\)/;

const main = document.querySelector("div.main_panel");
const observer = new MutationObserver(function (mutations) {
    if(!selfMutations(mutations)) {
        setupAnonify();
    }
});
observer.observe(main, {subtree: true, childList: true});

// Original use was https://github.com/LucasZamprogno/GitHub-Monitor/blob/master/contentScript.js
// Reduce multiple firings of anonify. Still often runs 2-3 times
function setupAnonify() {
    if(debounceTimeout === null) { // First DOM change in a while? Set the timer
        debounceTimeout = setTimeout(function(){
            anonify();
            clearTimeout(debounceTimeout);
            debounceTimeout = null;
        }, MUTATION_TIMEOUT);
    } else { // Timer was already running? Clear it and set a new one (reset to MUTATION_TIMEOUT remaining)
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(function(){
            anonify();
            clearTimeout(debounceTimeout);
            debounceTimeout = null;
        }, MUTATION_TIMEOUT);
    }
}

function anonify() {
    const nameNumMap = {}; // Map of users to their anonymous number
    let anonCount = 0;
    const nameArray = main.querySelectorAll("div.user_name"); // Get all usernames
    for (const nameElem of nameArray) {
        if (nameElem.textContent.trim() === "Loading...") {
            setupAnonify(); // Try again later
            return;
        }
    }
	for (const nameElem of nameArray) {
	    try {
            if (nameElem.getAttribute("anon") === "stud") { // If anonymous to students
                const name = nameElem.textContent.trim();
                // Get/set their anonymous number
                let num;
                if (nameNumMap[name]) {
                    num = nameNumMap[name];
                } else {
                    anonCount++;
                    nameNumMap[name] = anonCount;
                    num = anonCount;
                }
                nameElem.setAttribute("anon", "extra"); // Won't get re-anonymized after more DOM mutations
                // "anon to classmates" span can be sibling or child for some reason, get via parent and copy anon name.
                const smallTextNode = nameElem.parentNode.querySelector("span.smallText");
                const anonName = getAnonName(smallTextNode, num);
                // and remove
                smallTextNode.remove();
                nameElem.title = trimAnonName(name); // Show name on hover
                nameElem.innerHTML = anonName; // Replace name
            }
        } catch (e) {
	        // Just in case something got unexpectedly modified/removed (likely poor debounce timing)
        }
    }
}

function getAnonName(smallTextNode, num) {
    const nameToClassmates = smallTextNode.textContent;
    const matches = nameToClassmates.match(ANON_INFO_REGEX) || [];
    return matches[1] || "Anonymous #" + num;
}

function trimAnonName(fullName) {
    return fullName.replace(ANON_INFO_REGEX, "").trim();
}

function selfMutations(mutations) {
    for (const mutation of mutations) {
        if (mutation.target.classList.contains("user_name") &&
            mutation.removedNodes.length > 0 &&
            (mutation.removedNodes[0].innerText === "(anon. to classmates)" ||
            mutation.addedNodes[0].parentNode.getAttribute("anon") === "extra")) {
            return true;
        }
    }
    return false;
}

console.log("Extra-anonymous loaded");
