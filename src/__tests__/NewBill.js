/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";
import { ROUTES_PATH } from "../constants/routes";

// POST New bill

jest.mock("../app/Store", () => mockStore);

beforeEach(() => {
  localStorage.setItem(
    "user",
    JSON.stringify({ type: "Employee", email: "a@a" })
  );
  const root = document.createElement("div");
  root.setAttribute("id", "root");
  document.body.append(root);
  router();
  window.onNavigate(ROUTES_PATH.NewBill);
});

afterEach(() => {
  jest.clearAllMocks();
  document.body.innerHTML = ""; //remise à zéro
});

const file = new File(["facture"], "facture.png", { type: "image/png" }); // nouvelle instance/facture avec fichier valide png

//test de créaction des entrées dugit fichier image de la facture
describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("then if I upload an image, the new file should be uploaded", () => {
      //upload parce que bon format
      const fileInput = screen.getByTestId("file"); //bibliothèque @testing-library/dom qui sélectionne ID : file
      userEvent.upload(fileInput, file); //écoute de l'événement, remplissage du champ input avec nom du fichier
      expect(fileInput.files[0]).toStrictEqual(file); //vérification que l'input ait bien chargé les informations
      expect(fileInput.files.item(0)).toStrictEqual(file);
      expect(fileInput.files).toHaveLength(1);
    });
  });

  // test de l'envoi
  describe("When I fill the bill's form and click on 'envoyer'", () => {
    const date = new Date();
    test("the form is submitted", async () => {
      //simultaion de remplissage de tous les champs
      userEvent.click(screen.getByTestId("expense-type")); //clic sur premier champ input type de dépense
      userEvent.click(screen.getByText("Transports")); //dans le cas où celui-ci est du type transport (premier)
      userEvent.type(screen.getByTestId("expense-name"), "facture"); //remplissage du nom avec "facture"
      screen.getByTestId("datepicker").value = date;
      userEvent.type(screen.getByTestId("amount"), "999");
      userEvent.type(screen.getByTestId("vat"), "20");
      userEvent.type(screen.getByTestId("pct"), "1");
      userEvent.type(
        screen.getByTestId("commentary"),
        "Commentaire de la facture."
      );
      userEvent.upload(screen.getByTestId("file"), file);
      userEvent.click(screen.getByText("Envoyer"));
      expect(await screen.findByText("Mes notes de frais")).toBeTruthy(); //vérification de la réussite, on revient au Dashboard "Mes notes de frais"
    });
  });
});
