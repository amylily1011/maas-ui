import { call, put, takeEvery, takeLatest } from "redux-saga/effects";

import bakery from "bakery";
import { ScriptResultNames } from "app/store/scriptresult/types";
import { getCookie } from "app/utils";

const BAKERY_LOGIN_API = "/MAAS/accounts/discharge-request/";
export const ROOT_API = "/MAAS/api/2.0/";
const SCRIPTS_API = `${ROOT_API}scripts/`;
const LICENSE_KEY_API = `${ROOT_API}license-key/`;
const LICENSE_KEYS_API = `${ROOT_API}license-keys/`;
const LOGIN_API = "/MAAS/accounts/login/";
const LOGOUT_API = "/MAAS/accounts/logout/";
const MACHINES_API = `${ROOT_API}machines/`;

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

const handleErrors = (response) => {
  if (!response.ok) {
    throw Error(response.statusText);
  }
  return response;
};

const handlePromise = (response) => {
  if (response.headers) {
    const contentType = response.headers.get("Content-Type");
    if (contentType.includes("application/json")) {
      return Promise.all([response.ok, response.json()]);
    } else {
      return Promise.all([response.ok, response.text()]);
    }
  }
};

const scriptresultsDownload = (systemId, scriptSetId, filters, filetype) => {
  const csrftoken = getCookie("csrftoken");
  // Generate the URL query string.
  const args = new URLSearchParams({
    op: "download",
    ...(filetype ? { filetype } : {}),
    ...(filters ? { filters } : {}),
  }).toString();
  return fetch(`${ROOT_API}nodes/${systemId}/results/${scriptSetId}/?${args}`, {
    method: "GET",
    headers: { ...DEFAULT_HEADERS, "X-CSRFToken": csrftoken },
  })
    .then(handleErrors)
    .then((response) => {
      if (filetype === "tar.xz") {
        return response.blob();
      }
      return response.text();
    });
};

export const api = {
  auth: {
    checkAuthenticated: () => {
      return fetch(LOGIN_API).then((response) => {
        const status = response.status.toString();
        if (status.startsWith("5")) {
          // If a 5xx error is returned then the API server is down for
          // some reason.
          throw Error(response.statusText);
        }
        if (status.startsWith("4")) {
          // We take a 4xx error to mean that the user is not authenticated.
          return { authenticated: false };
        }
        return response.json();
      });
    },
    externalLogin: () => {
      return new Promise((resolve, reject) => {
        bakery.get(BAKERY_LOGIN_API, DEFAULT_HEADERS, (error, response) => {
          if (response.currentTarget.status !== 200) {
            localStorage.clear();
            reject(Error(response.currentTarget.responseText));
          } else {
            resolve({ response });
          }
        });
      });
    },
    login: (credentials) => {
      const params = {
        username: credentials.username,
        password: credentials.password,
      };

      return fetch(LOGIN_API, {
        method: "POST",
        mode: "no-cors",
        credentials: "include",
        headers: new Headers({
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
        }),
        body: new URLSearchParams(Object.entries(params)),
      })
        .then(handlePromise)
        .then(([responseOk, body]) => {
          if (!responseOk) {
            throw body;
          }
        });
    },
    logout: (csrftoken) => {
      localStorage.clear();
      return fetch(LOGOUT_API, {
        headers: { "X-CSRFToken": csrftoken },
        method: "POST",
      }).then((res) => {
        handleErrors(res);
        window.location.reload();
      });
    },
  },
  licenseKeys: {
    create: (key, csrftoken) => {
      const { osystem, distro_series, license_key } = key;
      return fetch(`${LICENSE_KEYS_API}`, {
        headers: { ...DEFAULT_HEADERS, "X-CSRFToken": csrftoken },
        method: "POST",
        body: JSON.stringify({ osystem, distro_series, license_key }),
      })
        .then(handlePromise)
        .then(([responseOk, body]) => {
          if (!responseOk) {
            throw body;
          }
          return body;
        });
    },
    update: (key, csrftoken) => {
      const { osystem, distro_series, license_key } = key;
      return fetch(`${LICENSE_KEY_API}${osystem}/${distro_series}`, {
        headers: { ...DEFAULT_HEADERS, "X-CSRFToken": csrftoken },
        method: "PUT",
        body: JSON.stringify({ license_key }),
      })
        .then(handlePromise)
        .then(([responseOk, body]) => {
          if (!responseOk) {
            throw body;
          }
          return body;
        });
    },
    delete: (osystem, distro_series, csrftoken) => {
      return fetch(`${LICENSE_KEY_API}${osystem}/${distro_series}`, {
        headers: { ...DEFAULT_HEADERS, "X-CSRFToken": csrftoken },
        method: "DELETE",
      }).then(handleErrors);
    },
    fetch: (csrftoken) => {
      return fetch(`${LICENSE_KEYS_API}`, {
        headers: { ...DEFAULT_HEADERS, "X-CSRFToken": csrftoken },
      })
        .then(handleErrors)
        .then((response) => response.json());
    },
  },
  machines: {
    addChassis: (params, csrftoken) => {
      return fetch(`${MACHINES_API}?op=add_chassis`, {
        headers: new Headers({
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-CSRFToken": csrftoken,
          "X-Requested-With": "XMLHttpRequest",
        }),
        method: "POST",
        body: new URLSearchParams(Object.entries(params)),
      })
        .then(handlePromise)
        .then(([responseOk, body]) => {
          if (!responseOk) {
            throw body;
          }
        });
    },
  },
  scriptresults: {
    download: scriptresultsDownload,
    getCurtinLogsTar: (systemId) =>
      scriptresultsDownload(
        systemId,
        "current-installation",
        ScriptResultNames.CURTIN_LOG
      ),
  },
  scripts: {
    fetch: (csrftoken) => {
      return fetch(`${SCRIPTS_API}?include_script=true`, {
        headers: { ...DEFAULT_HEADERS, "X-CSRFToken": csrftoken },
      })
        .then(handleErrors)
        .then((response) => response.json());
    },
    delete: (name, csrftoken) => {
      return fetch(`${SCRIPTS_API}${name}`, {
        headers: { ...DEFAULT_HEADERS, "X-CSRFToken": csrftoken },
        method: "DELETE",
      }).then(handleErrors);
    },
    upload: (script, csrftoken) => {
      const { name, type, contents } = script;
      return fetch(`${SCRIPTS_API}`, {
        headers: { ...DEFAULT_HEADERS, "X-CSRFToken": csrftoken },
        method: "POST",
        body: JSON.stringify({ name, type, script: contents }),
      })
        .then(handlePromise)
        .then(([responseOk, body]) => {
          if (!responseOk) {
            throw body;
          }
        });
    },
  },
};

export function* checkAuthenticatedSaga(action) {
  try {
    yield put({ type: "status/checkAuthenticatedStart" });
    const response = yield call(api.auth.checkAuthenticated);
    yield put({
      payload: response,
      type: "status/checkAuthenticatedSuccess",
    });
  } catch (error) {
    yield put({
      error: true,
      payload: error.message,
      type: "status/checkAuthenticatedError",
    });
  }
}

export function* loginSaga(action) {
  try {
    yield put({ type: "status/loginStart" });
    yield call(api.auth.login, action.payload);
    yield put({
      type: "status/loginSuccess",
    });
  } catch (error) {
    yield put({
      error: true,
      payload: error,
      type: "status/loginError",
    });
  }
}

export function* logoutSaga(action) {
  const csrftoken = yield call(getCookie, "csrftoken");
  try {
    yield put({ type: "status/logoutStart" });
    yield call(api.auth.logout, csrftoken);
    yield put({
      type: "status/logoutSuccess",
    });
    yield put({
      type: "status/websocketDisconnect",
    });
  } catch (error) {
    yield put({
      error: true,
      payload: { error: error.message },
      type: "status/logoutError",
    });
  }
}

export function* externalLoginSaga(action) {
  try {
    yield put({ type: "status/externalLoginStart" });
    yield call(api.auth.externalLogin);
    yield put({
      type: "status/externalLoginSuccess",
    });
  } catch (error) {
    yield put({
      error: true,
      payload: error.message,
      type: "status/externalLoginError",
    });
  }
}

export function* fetchLicenseKeysSaga() {
  const csrftoken = yield call(getCookie, "csrftoken");
  let response;
  try {
    yield put({ type: "licensekeys/fetchStart" });
    response = yield call(api.licenseKeys.fetch, csrftoken);
    yield put({
      type: "licensekeys/fetchSuccess",
      payload: response,
    });
  } catch (error) {
    yield put({
      errors: true,
      payload: { error: error.message },
      type: "licensekeys/fetchError",
    });
  }
}

export function* deleteLicenseKeySaga(action) {
  const csrftoken = yield call(getCookie, "csrftoken");
  try {
    yield put({ type: "licensekeys/deleteStart" });
    yield call(
      api.licenseKeys.delete,
      action.payload.osystem,
      action.payload.distro_series,
      csrftoken
    );
    yield put({
      type: "licensekeys/deleteSuccess",
      payload: action.payload,
    });
  } catch (error) {
    yield put({
      errors: true,
      payload: { error: error.message },
      type: "licensekeys/deleteError",
    });
  }
}

export function* createLicenseKeySaga(action) {
  const csrftoken = yield call(getCookie, "csrftoken");
  const key = action.payload;
  let response;
  try {
    yield put({ type: "licensekeys/createStart" });
    response = yield call(api.licenseKeys.create, key, csrftoken);
    yield put({
      type: "licensekeys/createSuccess",
      payload: response.payload,
    });
  } catch (errors) {
    let error = errors;
    if (typeof error === "string") {
      error = { "Create error": error };
    }
    yield put({
      errors: true,
      payload: error,
      type: "licensekeys/createError",
    });
  }
}

export function* updateLicenseKeySaga(action) {
  const csrftoken = yield call(getCookie, "csrftoken");
  const key = action.payload;
  let response;
  try {
    yield put({ type: "licensekeys/updateStart" });
    response = yield call(api.licenseKeys.update, key, csrftoken);
    yield put({
      type: "licensekeys/updateSuccess",
      payload: response,
    });
  } catch (errors) {
    let error = errors;
    if (typeof error === "string") {
      error = { "Create error": error };
    }
    yield put({
      errors: true,
      payload: error,
      type: "licensekeys/updateError",
    });
  }
}

export function* uploadScriptSaga(action) {
  const csrftoken = yield call(getCookie, "csrftoken");
  const script = action.payload;
  let response;
  try {
    yield put({ type: "script/uploadStart" });
    response = yield call(api.scripts.upload, script, csrftoken);
    yield put({
      type: "script/uploadSuccess",
      payload: response,
    });
  } catch (errors) {
    let error = errors;
    if (typeof error === "string") {
      error = { "Upload error": error };
    }
    yield put({
      errors: true,
      payload: error,
      type: "script/uploadError",
    });
  }
}

export function* addMachineChassisSaga(action) {
  const csrftoken = yield call(getCookie, "csrftoken");
  const params = action.payload.params;
  let response;
  try {
    yield put({ type: "machine/addChassisStart" });
    response = yield call(api.machines.addChassis, params, csrftoken);
    yield put({
      type: "machine/addChassisSuccess",
      payload: response,
    });
  } catch (err) {
    yield put({
      type: "machine/addChassisError",
      payload: err,
    });
  }
}

export function* watchExternalLogin() {
  yield takeLatest("status/externalLogin", externalLoginSaga);
}

export function* watchLogin() {
  yield takeLatest("status/login", loginSaga);
}

export function* watchLogout() {
  yield takeLatest("status/logout", logoutSaga);
}

export function* watchCheckAuthenticated() {
  yield takeLatest("status/checkAuthenticated", checkAuthenticatedSaga);
}

export function* watchCreateLicenseKey() {
  yield takeLatest("licensekeys/create", createLicenseKeySaga);
}

export function* watchUpdateLicenseKey() {
  yield takeLatest("licensekeys/update", updateLicenseKeySaga);
}

export function* watchDeleteLicenseKey() {
  yield takeEvery("licensekeys/delete", deleteLicenseKeySaga);
}

export function* watchFetchLicenseKeys() {
  yield takeLatest("licensekeys/fetch", fetchLicenseKeysSaga);
}

export function* watchUploadScript() {
  yield takeEvery("script/upload", uploadScriptSaga);
}

export function* watchAddMachineChassis() {
  yield takeEvery("machine/addChassis", addMachineChassisSaga);
}
