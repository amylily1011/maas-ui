import { Button } from "@canonical/react-components";
import classNames from "classnames";
import nanoid from "nanoid";
import PropTypes from "prop-types";
import React, { useEffect, useRef } from "react";
import usePortal from "react-useportal";

const getPositionStyle = (position, wrapper) => {
  if (!wrapper || !wrapper.current) {
    return undefined;
  }

  const dimensions = wrapper.current.getBoundingClientRect();
  const { bottom, left, width } = dimensions;
  const topPos = bottom + (window.scrollY || 0);
  let leftPos = left;

  switch (position) {
    case "left":
      leftPos = left;
      break;
    case "center":
      leftPos = left + width / 2;
      break;
    case "right":
      leftPos = left + width;
      break;
    default:
      break;
  }

  return { position: "absolute", left: leftPos, top: topPos };
};

const generateLink = (
  { children, className, onClick, ...props },
  key,
  closePortal
) => (
  <Button
    className={classNames("p-contextual-menu__link", className)}
    key={key}
    onClick={
      onClick
        ? () => {
            closePortal();
            onClick();
          }
        : null
    }
    {...props}
  >
    {children}
  </Button>
);

const ContextualMenu = ({
  className,
  dropdownClassName,
  hasToggleIcon,
  links,
  onToggleMenu,
  position = "right",
  positionNode,
  toggleAppearance,
  toggleClassName,
  toggleDisabled,
  toggleLabel,
  toggleLabelFirst = true
}) => {
  const id = useRef(nanoid());
  const wrapper = useRef(null);
  const hasToggle = hasToggleIcon || toggleLabel;
  const { openPortal, closePortal, isOpen, Portal } = usePortal({
    isOpen: !hasToggle
  });
  const labelNode = toggleLabel ? <span>{toggleLabel}</span> : null;
  const wrapperClass = classNames(
    className,
    ["p-contextual-menu", position === "right" ? null : position]
      .filter(Boolean)
      .join("--")
  );
  const positionStyle = getPositionStyle(position, positionNode || wrapper);

  useEffect(() => {
    onToggleMenu && onToggleMenu(isOpen);
    // onToggleMenu is excluded from the useEffect deps as onToggleMenu gets
    // redefined on a state update which causes an infinite loop here.
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span className={wrapperClass} ref={wrapper}>
      {hasToggle && (
        <Button
          appearance={toggleAppearance}
          aria-controls={id.current}
          aria-expanded={isOpen ? "true" : "false"}
          aria-haspopup="true"
          className={classNames("p-contextual-menu__toggle", toggleClassName)}
          disabled={toggleDisabled}
          hasIcon={hasToggleIcon}
          onClick={evt => {
            if (!isOpen) {
              openPortal(evt);
            } else {
              closePortal(evt);
            }
          }}
        >
          {toggleLabelFirst ? labelNode : null}
          {hasToggleIcon ? (
            <i
              className={classNames(
                "p-icon--contextual-menu p-contextual-menu__indicator",
                {
                  "is-light": ["negative", "positive"].includes(
                    toggleAppearance
                  )
                }
              )}
            ></i>
          ) : null}
          {toggleLabelFirst ? null : labelNode}
        </Button>
      )}
      {isOpen && (
        <Portal>
          <span className={wrapperClass} style={positionStyle}>
            <span
              className={classNames(
                "p-contextual-menu__dropdown",
                dropdownClassName
              )}
              id={id.current}
              aria-hidden={isOpen ? "false" : "true"}
              aria-label="submenu"
            >
              {links.map((item, i) => {
                if (Array.isArray(item)) {
                  return (
                    <span className="p-contextual-menu__group" key={i}>
                      {item.map((link, j) =>
                        generateLink(link, j, closePortal)
                      )}
                    </span>
                  );
                }
                if (typeof item === "string") {
                  return (
                    <div className="p-contextual-menu__non-interactive" key={i}>
                      {item}
                    </div>
                  );
                }
                return generateLink(item, i, closePortal);
              })}
            </span>
          </span>
        </Portal>
      )}
    </span>
  );
};

ContextualMenu.propTypes = {
  className: PropTypes.string,
  hasToggleIcon: PropTypes.bool,
  links: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape(Button.propTypes),
      PropTypes.arrayOf(PropTypes.shape(Button.propTypes))
    ])
  ).isRequired,
  onToggleMenu: PropTypes.func,
  positionNode: PropTypes.object,
  position: PropTypes.oneOf(["left", "center", "right"]),
  toggleAppearance: PropTypes.string,
  toggleClassName: PropTypes.string,
  toggleLabel: PropTypes.string,
  toggleLabelFirst: PropTypes.bool
};

export default ContextualMenu;