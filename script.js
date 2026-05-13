const bookSearch = document.getElementById("bookSearch");
const searchButton = document.querySelector(".actionBtn");
let resultArea = document.querySelector(".bookResult");
let loading = document.getElementById("loading");
let bottomBar = document.querySelector("bottomBar");
const bookShelf = document.querySelector(".bookShelf");

const dragBar = document.querySelector(".dragBar");
const page = document.querySelector(".page");

const notes = document.querySelector(".notes");
let noteText = document.querySelector(".notePad");

let closeBtn = document.getElementById("closeBtn");
let removeBtn = document.querySelector("#removeBtn");

let book1 = document.querySelector(".book1");
// setting all localStorage Attributes;
let isOpen = false;
let loadingState = false;
let currentBook; //global variables that allow us to remove later on
let bookIndex;
let activeBookId;
// localStorage.clear()
//problem when adding new features, have to reset local storage, if
//multiple users then cooked.
let numPages = JSON.parse(localStorage.getItem("numPages")) || [];
let bookTitles = JSON.parse(localStorage.getItem("bookTitles")) || [];
let covers = JSON.parse(localStorage.getItem("covers")) || [];
let bookPositions = [
  { x: -0.5, y: 0.5 },
  { x: -0.35, y: 0.5 },
  { x: -0.2, y: 0.5 },
  { x: -0.05, y: 0.5 },
  { x: -0.5, y: 0 - 0.2 },
  { x: -0.35, y: -0.2 },
  { x: -0.2, y: -0.2 },
  { x: -0.05, y: -0.2 },
];
let ids = JSON.parse(localStorage.getItem("ids")) || [];
//always render out first thing
render();

// dragBar.addEventListener('mousedown',()=>{
//     function whileMove(e){
//         const pos = Math.max(300,Math.min(e.clientX,590))
//         page.style.gridTemplateColumns = `${pos}px 1fr`;
//         dragBar.style.left = `${pos}px`
//         console.log(pos)
//     }
//     function endMove(){
//         window.removeEventListener('mousemove',whileMove)
//         window.removeEventListener('mouseup',endMove)
//         console.log("I'm here")
//     }
//     window.addEventListener('mousemove', whileMove)
//     window.addEventListener('mouseup', endMove)
// })

function onEnter(e) {
  if (e.key === "Enter") handleSearch();
}

bookSearch.addEventListener("focus", () => {
  bookSearch.addEventListener("keydown", onEnter);
});

bookSearch.addEventListener("blur", () => {
  bookSearch.removeEventListener("keydown", onEnter);
});

searchButton.addEventListener("click", handleSearch);

function handleSearch() {
  if (bookSearch.value === "") return;

  resultArea.innerHTML = "";
  loading.textContent = "GETTING YOUR BOOK...";

  const titleFormat = bookSearch.value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "+");
  async function getBooks() {
    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?title=${titleFormat}`,
      );
      if(!response.ok){
        throw new Error(`Error: ${response.status}`)
      }

      // idea is that forward slash (/) represents start and end of regex, (\s) represents white space and (+)
      // represents find all white spaces (g) is a flag after they end that says go through the rest of the string
      //even if you found it already
      const bookData = await response.json();
      const coverID = bookData.docs[0].cover_i;
      const authorName = bookData.docs[0].author_name;
      const publishYear = bookData.docs[0].first_publish_year;
      const title = bookData.docs[0].title;
      const edition = bookData.docs[0].key;

      // in this case (key = id) and (value = coverID) and (size = -M)
      const cover = `https://covers.openlibrary.org/b/id/${coverID}-L.jpg`;
      console.log(cover)
      const bookDetails = await fetch(
        `https://openlibrary.org${edition}/editions.json`,
      );
      const response2 = await bookDetails.json();
      let details = [];
      for (i = 0; i < 6; i++) {
        const pages = response2.entries[i].number_of_pages;
        pages ? details.push(pages) : details.push(0);
      }
      const pages = Math.max(...details);

      // add all the elements needed

      const bookContainer = document.createElement("div");
      bookContainer.classList.add("bookContainer");

      const book = document.createElement("div");
      book.classList.add("book");

      const coverPage = document.createElement("img");
      coverPage.setAttribute("src", cover);
      coverPage.setAttribute("alt", "this image");

      const bookText = document.createElement("div");
      bookText.innerHTML = `
      <p class = "bookInfo">(Published: ${publishYear})</p>
      <h2 id = "heading">${title}</h2>
      <p class = "bookInfo">By: ${authorName}</p>`
    

      bookText.classList.add("bookText");

      const addShelf = document.createElement("button");
      addShelf.textContent = "Add to Shelf";
      addShelf.classList.add("shelfAdd");
      addShelf.classList.add("actionBtn");

      // addShelf function
      addShelf.addEventListener("click", () => {
        // every time a book is added check how many covers there are, and add subsequent y values
        // in order to create percieved stacking. adding 0.3 y-coord every time
        // handle all stored stuff, so id, cover url, and position

       let length = covers.length;
       if (length > 0) {
          if (covers.includes(cover)) {
            return;
          }
        }
        const idSelect = `id:${cover}`;

        covers.push(cover);
        bookTitles.push(title);
        numPages.push(pages);

        localStorage.setItem(idSelect, ""); // intialize notes
        localStorage.setItem("covers", JSON.stringify(covers)); // covers
        localStorage.setItem("bookTitles", JSON.stringify(bookTitles));
        localStorage.setItem("numPages", JSON.stringify(numPages));

        render();
      });

      const clear = document.createElement("button");
      clear.textContent = "Clear";
      clear.classList.add("resultClear");
      clear.classList.add("actionBtn");
      loading.innerHTML = ""

      // clear function
      clear.addEventListener("click", () => {
        resultArea.innerHTML = "";
      });

      resultArea.appendChild(bookContainer);
      bookContainer.appendChild(book);
      book.appendChild(coverPage);
      resultArea.appendChild(bookText);
      resultArea.appendChild(addShelf);
      resultArea.appendChild(clear);
    } catch (error) {
      console.log(error)
      loading.textContent = "Book Was Not Found";
    }
  }

  // run some api
  // if resolved create the book cover if not return the error statement
  bookSearch.value = "";
  getBooks();
}


async function render() {
  bookShelf.innerHTML = "";
  loadingState = true;

  if (covers.length > 0) {
    bookShelf.textContent = `LOADING...`;
    const finalBooks =  covers.map((bookCover, index) => {
      const data = `id:${bookCover}`;
      const name = `${index}`;
      const bookTitle = `${bookTitles[index]}`;
      numPages[index] > 0 && numPages.length > 0
        ? (calcWidth = Math.min(70, Math.max(20, numPages[index] / 10)))
        : (calcWidth = 20);
      const pageWidth = `${calcWidth}px`;

      const bookContainer = document.createElement("div");
      bookContainer.style.setProperty("--spine-width", pageWidth);
      bookContainer.classList.add("bookContainer1");

      const book = document.createElement("div");
      book.classList.add("book1");
      book.setAttribute("id", data);
      book.setAttribute("data-index", name);
      book.setAttribute("data-title", bookTitle);

      const spine = document.createElement("div");
      spine.classList.add("spine");
      spine.setAttribute("onclick", "mouseClick(event)");
      spine.textContent = bookTitle;

      const whitePages = document.createElement("div");
      whitePages.classList.add("whitePages");

      const backCover = document.createElement("div");
      backCover.classList.add("backCover");

      const coverPage = document.createElement("img");
      coverPage.setAttribute("onclick", "mouseClick(event)");
      coverPage.setAttribute("src", bookCover);
      coverPage.setAttribute("alt", "this image");

      return new Promise((resolve)=>{
        const img = new Image();
        img.src = bookCover;
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.height = img.naturalHeight;
          canvas.width = img.naturalWidth;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const color = [data.data[0], data.data[1], data.data[2], data.data[3]];
          const shadowColor = [data.data[0] - 20, data.data[1] - 20, data.data[2] - 20, data.data[3]];
          const width = data.width/2
          const height = Math.min(250, Math.max(data.height, 175))
          console.log(width)
          console.log(height)

          spine.style.boxShadow = `inset 2px 4px 4px rgba(${shadowColor})`;
          spine.style.backgroundColor = `rgba(${color})`;
          backCover.style.backgroundColor = `rgba(${color})`;

          
          bookContainer.style.setProperty("--cover-width", `${width}px`)
          bookContainer.style.setProperty("--cover-height", `${height}px`)
          resolve({
            bookContainer,
            book,
            coverPage,
            spine,
            whitePages,
            backCover,
            })
        };
      })
    });
    const books = await Promise.all(finalBooks)
    bookShelf.textContent = "";
    books.forEach(({
        bookContainer,
        book,
        coverPage,
        spine,
        whitePages,
        backCover,
      })=>{
        bookShelf.appendChild(bookContainer)
        bookContainer.appendChild(book)
        book.appendChild(coverPage)
        book.appendChild(spine)
        book.appendChild(whitePages)
        book.appendChild(backCover)
    })

    
  } 
}

function mouseClick(event) {
  const id = event.target.closest(".book1").id;
  const index = event.target.closest(".book1").dataset.index;
  const title = event.target.closest(".book1").dataset.title;
  activeBookId = id;
  bookIndex = index;
  notePad(id, title);
  document.body.style.cursor = "auto";
}

// when click on book, let's open notes
function notePad(id, title) {
  const notesTaken = localStorage.getItem(id);
  noteText.value = notesTaken;
  document.getElementById("modalTitle").textContent = title;
  notes.showModal();
  noteText.focus();
  isOpen = true;
}

noteText.addEventListener("input", () => {
  localStorage.setItem(activeBookId, noteText.value);
});

removeBtn.addEventListener("click", () => {
  removeEverything(activeBookId, bookIndex, currentBook);
});

function removeEverything(id, index, book) {
  covers.splice(index, 1);
  localStorage.setItem("covers", JSON.stringify(covers));

  bookTitles.splice(index, 1);
  localStorage.setItem("bookTitles", JSON.stringify(bookTitles));

  numPages.splice(index, 1);
  localStorage.setItem("numPages", JSON.stringify(numPages));

  localStorage.removeItem(id);
  isOpen = false;

  render();
}
// localStorage.clear()
