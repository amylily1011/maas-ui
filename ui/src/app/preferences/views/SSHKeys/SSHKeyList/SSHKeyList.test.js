import { MemoryRouter } from "react-router-dom";
import { mount } from "enzyme";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import React from "react";

import SSHKeyList from "./SSHKeyList";

const mockStore = configureStore();

describe("SSHKeyList", () => {
  let state;

  beforeEach(() => {
    state = {
      sshkey: {
        loading: false,
        loaded: true,
        items: [
          {
            id: 1,
            key: "ssh-rsa aabb",
            keysource: { protocol: "lp", auth_id: "koalaparty" }
          },
          {
            id: 2,
            key: "ssh-rsa ccdd",
            keysource: { protocol: "gh", auth_id: "koalaparty" }
          },
          {
            id: 3,
            key: "ssh-rsa eeff",
            keysource: { protocol: "lp", auth_id: "maaate" }
          },
          {
            id: 4,
            key: "ssh-rsa gghh",
            keysource: { protocol: "gh", auth_id: "koalaparty" }
          },
          { id: 5, key: "ssh-rsa gghh" }
        ]
      }
    };
  });

  it("displays a loading component if SSH keys are loading", () => {
    state.sshkey.loading = true;
    const store = mockStore(state);
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[
            { pathname: "/account/prefs/ssh-keys", key: "testKey" }
          ]}
        >
          <SSHKeyList />
        </MemoryRouter>
      </Provider>
    );
    expect(wrapper.find("Loader").exists()).toBe(true);
  });

  it("can display errors", () => {
    state.sshkey.errors = "Unable to list SSH keys.";
    const store = mockStore(state);
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[
            { pathname: "/account/prefs/ssh-keys", key: "testKey" }
          ]}
        >
          <SSHKeyList />
        </MemoryRouter>
      </Provider>
    );
    expect(wrapper.find("Notification").text()).toEqual(
      "Error:Unable to list SSH keys."
    );
  });

  it("can group keys", () => {
    const store = mockStore(state);
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[
            { pathname: "/account/prefs/ssh-keys", key: "testKey" }
          ]}
        >
          <SSHKeyList />
        </MemoryRouter>
      </Provider>
    );
    // Two of the keys should be grouped together.
    expect(wrapper.find("MainTable").prop("rows").length).toBe(
      state.sshkey.items.length - 1
    );
    // The grouped keys should be displayed in sub cols.
    expect(wrapper.find(".p-table-sub-cols__item").length).toBe(2);
  });

  it("can display uploaded keys", () => {
    const store = mockStore(state);
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[
            { pathname: "/account/prefs/ssh-keys", key: "testKey" }
          ]}
        >
          <SSHKeyList />
        </MemoryRouter>
      </Provider>
    );
    const cols = wrapper
      .find("MainTable tbody tr")
      .at(3)
      .find("td");
    expect(cols.at(0).text()).toEqual("Upload");
    expect(cols.at(1).text()).toEqual("");
    expect(cols.at(2).text()).toEqual("ssh-rsa gghh...");
  });

  it("can display imported keys", () => {
    const store = mockStore(state);
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[
            { pathname: "/account/prefs/ssh-keys", key: "testKey" }
          ]}
        >
          <SSHKeyList />
        </MemoryRouter>
      </Provider>
    );
    const cols = wrapper
      .find("MainTable tbody tr")
      .at(0)
      .find("td");
    expect(cols.at(0).text()).toEqual("Launchpad");
    expect(cols.at(1).text()).toEqual("koalaparty");
    expect(cols.at(2).text()).toEqual("ssh-rsa aabb...");
  });
});