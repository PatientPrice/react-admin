import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Button from './Button'
import { showNotification } from 'ra-core';
import { push } from 'react-router-redux';

class AppendButton extends Component {
    handleClick = () => {
      const {
        clickHandler,
        resource,
        source,
        selectedIds,
        ...other
      } = this.props;

      clickHandler(source, selectedIds);
    };

    render() {
      return (
          <Button label="Append Selected" onClick={this.handleClick} />
      );
    }
}

AppendButton.propTypes = {
    push: PropTypes.func,
    record: PropTypes.object,
    showNotification: PropTypes.func,
};

export default connect(null, {
    showNotification,
    push,
})(AppendButton);