export default class BookModel {
  constructor(name, author, contributor, desc, qty, imagesUrl, uniqueKeys) {
    this._id = author + "-" + name;
    this.author = author;
    this.name = name;
    this.contributor = contributor;
    this.desc = desc;
    this.quantity = qty;
    this.imagesUrl = imagesUrl;
    this.uniqueKeys = uniqueKeys;
    this.requests = [];
  }
}
