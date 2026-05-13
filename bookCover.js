export function createBook(cover){
    const book = document.createElement('div')
    book.classList.add("book")
    book.setAttribute('src', cover)
    book.setAttribute('alt', 'this image')
    return book
}