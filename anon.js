MutationObserver = window.MutationObserver;
console.log("updated");
let debounceTimeout = null;
const MUTATION_TIMEOUT = 150; // ms

const main = document.querySelector("div.main_panel");
const observer = new MutationObserver(DOMDebounce);
observer.observe(main, {subtree: true, childList: true});

// Original use was https://github.com/LucasZamprogno/GitHub-Monitor/blob/master/contentScript.js
// Reduce multiple firings of anonify. Still often runs 2-3 times
function DOMDebounce() {
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
	const nameArray = document.querySelectorAll("div.user_name"); // Get all usernames
	for (const nameElem of nameArray) {
	    try {
            if (nameElem.getAttribute("anon") === "stud") { // If anonymous to students
                // "anon to classmates" span can be sibling or child for some reason, get via parent and remove
                nameElem.parentNode.querySelector("span.smallText").remove();
                const name = nameElem.textContent.trim();
                nameElem.title = name; // Show name on hover
                // Get/set their anonymous number
                let num;
                if (nameNumMap[name]) {
                    num = nameNumMap[name];
                } else {
                    anonCount++;
                    nameNumMap[name] = anonCount;
                    num = anonCount;
                }
                nameElem.innerHTML = "Anonymous #" + num; // Replace name
                nameElem.setAttribute("anon", "extra"); // Won't get re-anonymized after more DOM mutations
            }
        } catch (e) {
	        // Just in case something got unexpectedly modified/removed (likely poor debounce timing)
        }
    }
}

console.log("Extra-anonymous loaded");