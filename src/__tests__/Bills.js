/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import userEvent from "@testing-library/user-event";
import mockStore from "../__mocks__/store";
import Bills from "../containers/Bills.js"; // à ajouter pour le test get bills lignes 44-74
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //ajout de la mention expect qui renvoie le booléean true lorsque l'icône est active
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => a - b;
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
    // Nouveau test  New Test
    // test concerning link from the "nouvelle note/new bill button"
    test("cliquons sur 'Nouvelle note de frais'/ click on Newbill, vérification du lien vers/link should be /#employee/bill/new", () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      userEvent.click(screen.getByText("Nouvelle note de frais"));
      expect(window.location.href).toEqual(
        "http://localhost/#employee/bill/new"
      );
    });
    // Nouveau test  New Test
    // test concerning viewing picture of a bill, link is on eye icon
    test("Test : click on the eye icon, the picture of the bill should appear", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      const iconEyes = screen.getAllByTestId("icon-eye");
      userEvent.click(iconEyes[0]);
      expect(screen.getByText("Justificatif")).toBeTruthy(); //pop up dont le titre Justificatif apparaît
    });
  });
});

//test d'intégration de GET Bills
// ce test est inspiré de celui de Dashboard
describe("when using GET method to access bills from the backend", () => {
  test("Then it should render bills", async () => {
    const bills = new Bills({
      document,
      onNavigate,
      store: mockStore,
      localStorage: window.localStorage,
    });
    const getBills = jest.fn(() => bills.getBills());
    const response = await getBills();
    expect(response.length).toBe(4); //dans le store mocked il y a 4 factures __mocks__stores
    expect(getBills).toHaveBeenCalled();
  });
});

//TEST des erreurs 404 ET 500, inspiré du dernier test de Dashboard
describe("When an error occurs on API", () => {
  //erreur concernant l'API en lien avec le backend
  beforeEach(() => {
    jest.spyOn(mockStore, "bills");
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "a@a",
      })
    );
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.appendChild(root);
    router();
  });

  test("fetches bills from an API and fails with 404 message error", async () => {
    //erreur de récupération des factures : non trouvées
    mockStore.bills.mockImplementationOnce(() => {
      //Il faut avertir l'utilisateur du type d'erreur 404/non trouvé
      return {
        list: () => {
          return Promise.reject(new Error("Erreur 404, non trouvé"));
        },
      };
    });
    window.onNavigate(ROUTES_PATH.Bills);
    await new Promise(process.nextTick);
    const message = screen.getByText(/Erreur 404/);
    expect(message).toBeTruthy();
  });

  test("fetches messages from an API and fails with 500 message error", async () => {
    //Autre situation d'erreur, 505, version de protocole non supporté
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(
            new Error("Erreur 500, protocole non supporté")
          );
        },
      };
    });
    window.onNavigate(ROUTES_PATH.Bills);
    await new Promise(process.nextTick);
    const message = screen.getByText(/Erreur 500/);
    expect(message).toBeTruthy();
  });
});
