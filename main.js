const { Plugin } = require('obsidian');

const CATEGORY_BG_COLORS = {
    "эффективность": "#fff9f2", "разработка": "#ebffff", "edtech": "#f5fff7",
    "съёмка": "#f7f9ff", "художественное": "#fffdf0",
    "психология": "#faf1dd",
    "архитектура ПО": "#fff3f3", "AI": "#dfe6ff",
    //"фронтенд": "red",
    "Python": "#25912b",
    "менеджмент": "#f9fd95",
    "дизайн": "#d324ff",
    "default": "#574f4f"
};

const CATEGORY_FONT_COLORS = {
    "Python": "#fff",
    "дизайн": "#ffffec",
};



class Books {
  constructor(dv) {
    // console.log(dv)
    this.dv = dv;  
    this.getAllCategory()
  }

  refresh(){
    this.getAllCategory()
  }

  formatDate = d => {
    if (!d) return '';
    return d.year === this.dv.date("now").year
        ? d.toFormat("d MMMM", { locale: "ru" })
        : d.toFormat("d MMMM yyyy", { locale: "ru" });
  }

  
  getCategoryBgColor = category => {
    return (category in CATEGORY_BG_COLORS) ? CATEGORY_BG_COLORS[category]: CATEGORY_BG_COLORS["default"];
  }

  getCategoryFontColor = category => {
    return (category in CATEGORY_FONT_COLORS) ? CATEGORY_FONT_COLORS[category]: CATEGORY_FONT_COLORS["default"];
  }
  
  renderCategories = book => {
    return (book.Категории ? book.Категории : []).map(
        c => `<span class="category" style="background-color: ${this.getCategoryBgColor(c)}; color: ${this.getCategoryFontColor(c)};">${c}</span>`
    ).join(" ");
  }


  renderBook = (book, additionalBookRenderFunction) => {
    return `<div class="book">
        <a href="${book.file.name}.md" class="internal-link" target="_blank" rel="noopener nofollow"><img src="${book.Обложка}" data-filename="${book.file.name}" /></a>
        ${book.Progress}
        ${additionalBookRenderFunction(book)}
        <a href="${book.file.name}.md" target="_blank" rel="noopener nofollow">T${book.Title}</a>
        <div class="categories">${this.renderCategories(book)}</div>
        <div class="pages">${book.Pages} стр.</div>
    </div>`;
  }

  renderBooks = (booksFiles, additionalBookRenderFunction) => {
    let booksHtml = [];
    for (const book of booksFiles) {
        booksHtml.push(this.renderBook(book, additionalBookRenderFunction))
    }
    return booksHtml.join("");
  }

  // Этот метод будет использовать Dataview для получения всех книг
  getBooks() {
    if (!this.dv) {
      console.error("Dataview plugin is not available.");
      return;
    }

    const books = this.dv.pages("")
      .where(page => {
        if (page["Type"] && page["Type"].path == "nodes/Books.md"
            && !["templates", "templater"].includes(page.file.folder)) {
          return page;
        }
      });
    return books;
  }

  getReading(){
    return this.getBooks().where(page => {
      if(!page["Прочитано"] && !page["Finish reading"] && page["Start reading"]){
        return page
      }
    })
  }

  getAllCategory(){
    const pages = this.getBooks()
    this.categoryMap = {}

    const catAdd = (category, page) => {
      const objCat = this.categoryMap[category]
      if(objCat){
        objCat.push(page)
      } else {
        this.categoryMap[category] = [page]
      }
    }

    pages.forEach(page => {
      if(page.Категории){
        page.Категории.map(name => {
          catAdd(name, page)
        })
      }
    })
  }

  getListCategory(){
    return Object.keys(this.categoryMap)
  }

  getByCategory(category) {
    const pages = this.getBooks()
      .where(page => page.Категории && page.Категории.contains(category))
    return pages
  }
  getCategory(category) {
    console.log(this.categoryMap[category])
    const pages = this.categoryMap[category] || []
    return pages
  }

  // Для демонстрации все книги
  getAllBooks() {
    const books = this.getBooks();
    console.log("Books: ", books);
  }
}



module.exports = class MyCustomScriptPlugin extends Plugin {
  async onload() {
    console.log("📦 My Custom Script plugin loaded. Ожидаем Dataview...");

    this.registerEvent(
      this.app.metadataCache.on("dataview:index-ready", () => {
        const dataviewPlugin = this.app.plugins.getPlugin("dataview");

        if (dataviewPlugin && dataviewPlugin.api) {
          const books = new Books(dataviewPlugin.api);
          window.books = books;
          console.log("✅ Dataview загружен. Books инициализирован.");
        } else {
          console.error("❌ Dataview API не доступен.");
        }
      })
    );
    
    this.app.vault.on("modify", () => {
      if (window.books) {
        setTimeout(() => {
          window.books.refresh();
          console.log(window.books.categoryMap)
        }, 200);
        console.log("✅ Книги обновлены.");
      }
    })
  }

  onunload() {
    console.log("My Custom Script plugin unloaded!");
  }
}
