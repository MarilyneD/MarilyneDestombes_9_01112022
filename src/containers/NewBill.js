import { ROUTES_PATH } from "../constants/routes.js";
import Logout from "./Logout.js";

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const formNewBill = this.document.querySelector(
      `form[data-testid="form-new-bill"]`
    );
    formNewBill.addEventListener("submit", this.handleSubmit);
    const file = this.document.querySelector(`input[data-testid="file"]`);
    file.addEventListener("change", this.handleChangeFile);
    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;
    new Logout({ document, localStorage, onNavigate });
  }
  handleChangeFile = (e) => {
    e.preventDefault();
    const file = this.document.querySelector(`input[data-testid="file"]`)
      .files[0];
    const filePath = e.target.value.split(/\\/g);
    const fileName = filePath[filePath.length - 1];
    const formData = new FormData();
    const email = JSON.parse(localStorage.getItem("user")).email;
    formData.append("file", file);
    formData.append("email", email);
    //vérification du type de fichier image avant stockage dans le store
    let validatedFile = ["image/jpg", "image/jpeg", "image/png"].includes(
      file.type
    );
    if (validatedFile) {
    } else {
      alert(
        "type de fichier image non autorisé, sélectionner une image jpg jpeg png"
      );
    }
    this.formData = formData;
    this.fileName = fileName;
    // BUG : les lignes suivantes créent une entrée dans le store dès qu'une image est selectionnée
    // à déplacer dans la fonction handleSubmit, seulement à l'envoi du formulaire entier
    // this.store
    //   .bills()
    //   .create({
    //     data: formData,
    //     headers: {
    //       noContentType: true,
    //     },
    //   })
    //   .then(({ fileUrl, key }) => {
    //     console.log(fileUrl);
    //     this.billId = key;
    //     this.fileUrl = fileUrl;
    //     this.fileName = fileName;
    //   })
    //   .catch((error) => console.error(error));
  };

  handleSubmit = (e) => {
    e.preventDefault();
    console.log(
      'e.target.querySelector(`input[data-testid="datepicker"]`).value',
      e.target.querySelector(`input[data-testid="datepicker"]`).value
    );
    const email = JSON.parse(localStorage.getItem("user")).email;
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(
        e.target.querySelector(`input[data-testid="amount"]`).value
      ),
      date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct:
        parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) ||
        20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`)
        .value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: "pending",
    };

    // création d'une entrée dans le store, lignes reprises de la fonction handleChangeFile
    // puis "then" envoi des données via updateBill de l'API /app/Store.js
    this.store
      .bills()
      .create({
        data: this.formData,
        headers: {
          noContentType: true,
        },
      })
      .then(({ fileUrl, key }) => {
        console.log(fileUrl);
        this.billId = key;
        this.fileUrl = fileUrl;
        this.fileName = this.fileName;
        this.updateBill(bill); // envoi des data dans le backend
        this.onNavigate(ROUTES_PATH["Bills"]); // ligne reprise qui met à jour les routes
      })
      .catch((error) => console.error(error));
  };

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId }) //patch vers le backend (/app/Store.js)
        .then(() => {
          this.onNavigate(ROUTES_PATH["Bills"]);
        })
        .catch((error) => console.error(error));
    }
  };
}
