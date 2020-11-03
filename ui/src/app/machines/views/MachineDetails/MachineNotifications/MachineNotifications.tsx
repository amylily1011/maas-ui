import { Link } from "react-router-dom";
import { Notification, Spinner } from "@canonical/react-components";
import { useParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import React, { useEffect } from "react";

import { general as generalActions } from "app/base/actions";
import {
  useCanEdit,
  useHasInvalidArchitecture,
  useIsRackControllerConnected,
} from "app/store/machine/utils";
import generalSelectors from "app/store/general/selectors";
import LegacyLink from "app/base/components/LegacyLink";
import machineSelectors from "app/store/machine/selectors";
import type { RootState } from "app/store/root/types";
import type { Event } from "app/store/machine/types";

type RouteParams = {
  id: string;
};

const formatEventText = (event: Event) => {
  if (!event) {
    return "";
  }
  const text = [];
  if (event.type?.description) {
    text.push(event.type.description);
  }
  if (event.description) {
    text.push(event.description);
  }
  return text.join(" - ");
};

const MachineNotifications = (): JSX.Element => {
  const dispatch = useDispatch();
  const params = useParams<RouteParams>();
  const { id } = params;
  const machine = useSelector((state: RootState) =>
    machineSelectors.getById(state, id)
  );
  const architectures = useSelector(generalSelectors.architectures.get);
  const hasUsableArchitectures = architectures.length > 0;
  const canEdit = useCanEdit(machine, true);
  const isRackControllerConnected = useIsRackControllerConnected();
  const hasInvalidArchitecture = useHasInvalidArchitecture(machine);

  useEffect(() => {
    dispatch(generalActions.fetchArchitectures());
  }, [dispatch]);

  // Confirm that the full machine details have been fetched. This also allows
  // TypeScript know we're using the right union type (otherwise it will
  // complain that events don't exist on the base machine type).
  if (!machine || !("events" in machine)) {
    return <Spinner />;
  }
  const notifications = [
    {
      active: machine.power_state === "error" && machine.events?.length > 0,
      content: (
        <>
          {formatEventText(machine.events[0])}.{" "}
          <Link
            to={`/machine/${machine.system_id}/logs`}
            className="p-notification__action"
          >
            See logs
          </Link>
        </>
      ),
      status: "Error:",
      type: "negative",
    },
    {
      active: canEdit && !isRackControllerConnected,
      content:
        "Editing is currently disabled because no rack controller is currently connected to the region.",
      status: "Error:",
      type: "negative",
    },
    {
      active:
        canEdit &&
        hasInvalidArchitecture &&
        isRackControllerConnected &&
        hasUsableArchitectures,
      content:
        "This machine currently has an invalid architecture. Update the architecture of this machine to make it deployable.",
      status: "Error:",
      type: "negative",
    },
    {
      active:
        canEdit &&
        hasInvalidArchitecture &&
        isRackControllerConnected &&
        !hasUsableArchitectures,
      content: (
        <>
          No boot images have been imported for a valid architecture to be
          selected. Visit the{" "}
          <LegacyLink route="/images">images page</LegacyLink> to start the
          import process.
        </>
      ),
      status: "Error:",
      type: "negative",
    },
    {
      active: machine.cpu_count === 0,
      content:
        "Commission this machine to get CPU, Memory and Storage information.",
    },
  ].filter(({ active }) => active);

  return (
    <section className="p-strip u-no-padding--top u-no-padding--bottom">
      <div className="row">
        {notifications.map(({ content, status, type }, i) => (
          <Notification key={i} status={status} type={type}>
            {content}
          </Notification>
        ))}
      </div>
    </section>
  );
};

export default MachineNotifications;