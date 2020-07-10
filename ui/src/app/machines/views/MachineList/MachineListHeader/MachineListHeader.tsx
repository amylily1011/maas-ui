import { Button } from "@canonical/react-components";
import PropTypes from "prop-types";
import pluralize from "pluralize";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";

import {
  filtersToString,
  getCurrentFilters,
  toggleFilter,
} from "app/machines/search";
import {
  machine as machineActions,
  resourcepool as resourcePoolActions,
} from "app/base/actions";
import {
  machine as machineSelectors,
  resourcepool as resourcePoolSelectors,
} from "app/base/selectors";
import type {
  Machine,
  MachineAction,
  MachineState,
} from "app/store/machine/types";
import ActionFormWrapper from "./ActionFormWrapper";
import AddHardware from "./AddHardwareMenu";
import MachineListActionMenu from "./MachineListActionMenu";
import SectionHeader from "app/base/components/SectionHeader";

const getMachineCount = (
  machines: Machine[],
  selectedMachines: MachineState["selected"],
  setSearchFilter: (filter: string) => void
) => {
  const machineCountString = `${machines.length} ${pluralize(
    "machine",
    machines.length
  )}`;
  if (selectedMachines.length) {
    if (machines.length === selectedMachines.length) {
      return "All machines selected";
    }
    return (
      <Button
        className="p-button--link"
        onClick={() => setSearchFilter("in:(Selected)")}
      >
        {`${selectedMachines.length} of ${machineCountString} selected`}
      </Button>
    );
  }
  return `${machineCountString} available`;
};

type Props = {
  searchFilter?: string;
  selectedAction?: MachineAction;
  setSearchFilter: (filter: string) => void;
  setSelectedAction: (action: MachineAction) => void;
};

export const MachineListHeader = ({
  searchFilter,
  selectedAction,
  setSearchFilter,
  setSelectedAction,
}: Props): JSX.Element => {
  const dispatch = useDispatch();
  const location = useLocation();
  const machines = useSelector(machineSelectors.all);
  const machinesLoaded = useSelector(machineSelectors.loaded);
  const resourcePools = useSelector(resourcePoolSelectors.all);
  const selectedMachines = useSelector(machineSelectors.selected);

  useEffect(() => {
    dispatch(machineActions.fetch());
    dispatch(resourcePoolActions.fetch());
  }, [dispatch]);

  useEffect(() => {
    if (location.pathname !== "/machines") {
      setSelectedAction(null);
    }
  }, [location.pathname, setSelectedAction]);

  const setAction = (action: MachineAction, deselect?: boolean) => {
    if (action || deselect) {
      const filters = getCurrentFilters(searchFilter);
      const newFilters = toggleFilter(
        filters,
        "in",
        "selected",
        false,
        !deselect
      );
      setSearchFilter(filtersToString(newFilters));
    }
    setSelectedAction(action);
  };

  const getHeaderButtons = () => {
    if (location.pathname === "/machines") {
      return [
        <AddHardware
          disabled={selectedMachines.length > 0}
          key="add-hardware"
        />,
        <MachineListActionMenu
          key="machine-list-action-menu"
          setSelectedAction={setAction}
        />,
      ];
    }
    if (location.pathname === "/pools") {
      return [
        <Button data-test="add-pool" element={Link} to="/pools/add">
          Add pool
        </Button>,
      ];
    }
    return null;
  };

  return (
    <SectionHeader
      buttons={getHeaderButtons()}
      formWrapper={
        selectedAction && (
          <ActionFormWrapper
            selectedAction={selectedAction}
            setSelectedAction={setAction}
          />
        )
      }
      loading={!machinesLoaded}
      subtitle={getMachineCount(machines, selectedMachines, setSearchFilter)}
      tabLinks={[
        {
          active: location.pathname.startsWith("/machines"),
          label: `${pluralize("Machine", machines.length, true)}`,
          path: "/machines",
        },
        {
          active: location.pathname.startsWith("/pool"),
          label: `${pluralize("Resource pool", resourcePools.length, true)}`,
          path: "/pools",
        },
      ]}
      title="Machines"
    />
  );
};

MachineListHeader.propTypes = {
  searchFilter: PropTypes.string,
  selectedAction: PropTypes.object,
  setSearchFilter: PropTypes.func.isRequired,
  setSelectedAction: PropTypes.func.isRequired,
};

export default MachineListHeader;