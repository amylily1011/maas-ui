import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import { mount } from "enzyme";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";

import SetPoolForm from "../SetPoolForm";
import { rootState as rootStateFactory } from "testing/factories";

const mockStore = configureStore();

describe("SetPoolFormFields", () => {
  let state;
  beforeEach(() => {
    state = rootStateFactory({
      machine: {
        errors: null,
        loading: false,
        loaded: true,
        items: [
          {
            system_id: "abc123",
          },
          {
            system_id: "def456",
          },
        ],
        selected: ["abc123", "def456"],
        statuses: {
          abc123: { settingPool: false },
          def456: { settingPool: false },
        },
      },
      resourcepool: {
        errors: {},
        items: [
          { id: 0, name: "default" },
          { id: 1, name: "pool-1" },
        ],
      },
    });
  });

  it("shows a select if select pool radio chosen", async () => {
    const store = mockStore(state);
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/machines", key: "testKey" }]}
        >
          <SetPoolForm
            setProcessing={jest.fn()}
            setSelectedAction={jest.fn()}
          />
        </MemoryRouter>
      </Provider>
    );
    await act(async () => {
      wrapper.find("[data-test='select-pool'] input").simulate("change", {
        target: { name: "poolSelection", value: "select" },
      });
    });
    wrapper.update();
    expect(wrapper.find("Select").exists()).toBe(true);
  });

  it("shows inputs for creating a pool if create pool radio chosen", async () => {
    const store = mockStore(state);
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/machines", key: "testKey" }]}
        >
          <SetPoolForm
            setProcessing={jest.fn()}
            setSelectedAction={jest.fn()}
          />
        </MemoryRouter>
      </Provider>
    );
    await act(async () => {
      wrapper.find("[data-test='create-pool'] input").simulate("change", {
        target: { name: "poolSelection", value: "create" },
      });
    });
    wrapper.update();
    expect(wrapper.find("Input[name='name']").exists()).toBe(true);
    expect(wrapper.find("Input[name='description']").exists()).toBe(true);
  });
});
