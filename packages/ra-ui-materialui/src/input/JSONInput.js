import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { addField, FieldTitle } from 'ra-core';
import { Field } from 'redux-form';
import { Labeled } from 'react-admin';

import JSONEditor from 'react-json-editor-ajrm';
import locale    from 'react-json-editor-ajrm/locale/en';

const parseJSONBody = (value, previousValue, allValues, previousAllValues) => {
  try {
    return value
  } catch (e) {
    if (e instanceof SyntaxError) {
      return previousValue
    } else {
      throw e
    }
  }
};


class JSONInputComponent extends Component {
  render() {
    const { input: { value, onChange} } = this.props;
    return (
      <JSONEditor
        theme      = "dark_vscode_tribute"
        locale      = { locale }
        height      = '500px'
        placeholder = { value } // (value) => {if (value) {return value} else {return {}}} }
        onChange    = {
          ({
            plainText,
            markupText,
            json,
            jsObject,
            lines,
            error
          }) => {
            onChange(jsObject);
          }
        }
      />
    )
  }
}

class JSONInput extends Component {

  render() {
    const {
      input,
      label,
      ...other
    } = this.props;

    const useLabel = label ? label : input.name

    return (

    <Labeled label={useLabel}>
      <div className="json-input-div">
        <Field
            {...other}
            name={input.name}
            component={JSONInputComponent}
            format={(value, name) => {if (value) {return value} else {return {}}} }
            // format={(value, name) => JSON.stringify(value)}
            normalize={parseJSONBody}
            onChange={this.onChange}
        />
      </div>
    </Labeled>
    );
  }
}

JSONInput.propTypes = {
  input: PropTypes.object,
  isRequired: PropTypes.bool,
  addLabel: PropTypes.bool,
  label: PropTypes.string,
  meta: PropTypes.object,
  options: PropTypes.object,
  resource: PropTypes.string,
  source: PropTypes.string,
  className: PropTypes.string
};

JSONInput.defaultProps = {
  input: {},
  isRequired: 'false',
  addLabel: true,
  meta: { touched: false, error: false },
  options: {},
  resource: '',
  source: '',
  className: ''
};

export default addField(JSONInput);