import * as matchers from "redux-saga-test-plan/matchers";
import { throwError } from "redux-saga-test-plan/providers";

import { expectSaga } from "redux-saga-test-plan";

import getCookie from "./utils";
import {
  api,
  fetchScriptsSaga,
  deleteScriptSaga,
  uploadScriptSaga
} from "./http";

describe("http sagas", () => {
  describe("fetch scripts", () => {
    it("returns a SUCCESS action", () => {
      const payload = [{ name: "script1" }];
      return expectSaga(fetchScriptsSaga)
        .provide([
          [matchers.call.fn(getCookie, "csrftoken"), "csrf-token"],
          [matchers.call.fn(api.scripts.fetch, "csrf-token"), payload]
        ])
        .put({ type: "FETCH_SCRIPTS_START" })
        .put({ type: "FETCH_SCRIPTS_SUCCESS", payload })
        .run();
    });

    it("handles errors", () => {
      const error = new Error("kerblam!");
      return expectSaga(fetchScriptsSaga)
        .provide([
          [matchers.call.fn(getCookie, "csrftoken"), "csrf-token"],
          [matchers.call.fn(api.scripts.fetch, "csrf-token"), throwError(error)]
        ])
        .put({ type: "FETCH_SCRIPTS_START" })
        .put({ type: "FETCH_SCRIPTS_ERROR", errors: { error: error.message } })
        .run();
    });
  });

  describe("delete scripts", () => {
    it("returns a SUCCESS action", () => {
      const action = {
        type: "DELETE_SCRIPT",
        payload: { id: 1, name: "script-1" }
      };
      return expectSaga(deleteScriptSaga, action)
        .provide([
          [matchers.call.fn(getCookie, "csrftoken"), "csrf-token"],
          [matchers.call.fn(api.scripts.delete, "csrf-token", "script-1"), true]
        ])
        .put({ type: "DELETE_SCRIPT_START" })
        .put({ type: "DELETE_SCRIPT_SUCCESS", payload: 1 })
        .run();
    });

    it("handles errors", () => {
      const action = { type: "DELETE_SCRIPT", payload: { name: "script-1" } };
      const error = new Error("kerblam!");
      return expectSaga(deleteScriptSaga, action)
        .provide([
          [matchers.call.fn(getCookie, "csrftoken"), "csrf-token"],
          [
            matchers.call.fn(api.scripts.delete, "csrf-token", "script-1"),
            throwError(error)
          ]
        ])
        .put({ type: "DELETE_SCRIPT_START" })
        .put({ type: "DELETE_SCRIPT_ERROR", errors: { error: error.message } })
        .run();
    });
  });

  describe("upload scripts", () => {
    it("returns a SUCCESS action", () => {
      const script = {
        name: "script-1",
        type: "commissioning",
        script: "#!/bin/sh/necho 'hi'"
      };
      const action = {
        type: "UPLOAD_SCRIPT",
        payload: script
      };
      return expectSaga(uploadScriptSaga, action)
        .provide([
          [matchers.call.fn(getCookie, "csrftoken"), "csrf-token"],
          [
            matchers.call.fn(api.scripts.upload, "csrf-token", "script-1"),
            script
          ]
        ])
        .put({ type: "UPLOAD_SCRIPT_START" })
        .put({ type: "UPLOAD_SCRIPT_SUCCESS", payload: script })
        .run();
    });

    it("handles errors", () => {
      const script = {
        name: "script-1",
        type: "commissioning",
        script: "#!/bin/sh/necho 'hi'"
      };
      const action = { type: "UPLOAD_SCRIPT", payload: script };
      const error = {
        name: "Script with that name already exists"
      };
      return expectSaga(uploadScriptSaga, action)
        .provide([
          [matchers.call.fn(getCookie, "csrftoken"), "csrf-token"],
          [
            matchers.call.fn(api.scripts.upload, "csrf-token", "script-1"),
            throwError(error)
          ]
        ])
        .put({ type: "UPLOAD_SCRIPT_START" })
        .put({ type: "UPLOAD_SCRIPT_ERROR", errors: { name: error.name } })
        .run();
    });
  });
});