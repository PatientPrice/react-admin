import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Button from './Button'
import { showNotification } from 'ra-core';
import { push } from 'react-router-redux';

class RemoveButton extends Component {
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
            <Button label="Remove" onClick={this.handleClick}/>
        );
    }
}

RemoveButton.propTypes = {
    push: PropTypes.func,
    source: PropTypes.string.isRequired,
    showNotification: PropTypes.func,
};

export default connect(null, {
    showNotification,
    push,
})(RemoveButton);