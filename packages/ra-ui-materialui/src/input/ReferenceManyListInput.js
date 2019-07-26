import React from 'react';
import PropTypes from 'prop-types';
import compose from 'recompose/compose';
import {addField, ReferenceManyListInputController, translate, FormField, FieldTitle} from 'ra-core';

import LinearProgress from '../layout/LinearProgress';
import Labeled from '../input/Labeled';
import ReferenceError from './ReferenceError';
import DefaultActions from "../list/ListActions"
import DefaultPagination from "../list/Pagination"
import Dialog from "@material-ui/core/Dialog"

import Button from '@material-ui/core/Button';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';

import {ListView} from "../list"
import {createStyles, withStyles} from "@material-ui/core"

import AppendButton from "../button/AppendButton"
import RemoveButton from "../button/RemoveButton"
import defaultTheme from "../defaultTheme"

import ReferenceManyListActions from "./ReferenceManyListActions"
import InputLabel from "@material-ui/core/InputLabel"

const styles = theme =>
    createStyles({
        root: {
            display: 'flex',
        },
        card: {
            position: 'relative',
            flex: '1 1 auto',
        },
        actions: {
            zIndex: 2,
            display: 'flex',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignSelf: 'flex-start',
        },
        noResults: {padding: 20},
        appBar: {
            position: 'relative',
        },
        title: {
            marginLeft: theme.spacing * 2,
            flex: 1,
        },
        paper: {},
        paperOld: {
            position: 'relative',
            backgroundColor: theme.palette.background.default,
            border: '2px solid #000',
            padding: theme.spacing.unit * 3,
            outline: 'none',
        },
        label: {
            position: 'relative',
        },
        value: {
            fontFamily: theme.typography.fontFamily,
            color: 'currentColor',
            padding: `${theme.spacing.unit}px 0 ${theme.spacing.unit / 2}px`,
            border: 0,
            boxSizing: 'content-box',
            verticalAlign: 'middle',
            background: 'none',
            margin: 0, // Reset for Safari
            display: 'block',
            width: '100%',
        },
    });

const sanitizeRestProps = (
    {
        actions,
        allowEmpty,
        aside,
        basePath,
        children,
        choices,
        classes = {},
        className,
        data,
        displayParams,
        error,
        exporter,
        filter,
        filters,
        filterToQuery,
        handleClose,
        handleShow,
        id,
        ids,
        input,
        isLoading,
        isOpen,
        isRequired,
        label,
        loadedOnce,
        meta,
        onAppend,
        onChange,
        onRemove,
        options,
        pagination,
        reference,
        referenceBasePath,
        referenceIds,
        resource,
        searchGrid,
        setFilter,
        setIds,
        setPagination,
        setSort,
        source,
        title,
        translate,
        warning,
        ...rest
    }
) => rest;

const UnstyledListView = props => {

    console.log(props)

    const {
        // from ReferenceArrayInputView
        actions,
        allowEmpty,
        aside,
        basePath,
        children,
        choices,
        classes,
        className,
        currentSort,
        data,
        defaultTitle,
        displayParams,
        error,
        exporter,
        filter,
        filters,
        filterValues,
        handleClose,
        handleShow,
        hasCreate,
        hideFilter,
        id,
        ids,
        input,
        isLoading,
        isRequired,
        label,
        loadedOnce,
        meta,
        onAppendIds,
        onChange,
        onRemoveIds,
        onSelect,
        onToggleItem,
        onUnselectItems,
        options,
        page,
        pagination,
        perPage,
        reference,
        referenceBasePath,
        referenceIds,
        resource,
        searchGrid,
        selectedIds,
        setFilter,
        setFilters,
        setIds,
        setPage,
        setPagination,
        setPerPage,
        setSort,
        showFilter,
        source,
        title,
        total,
        translate,
        version,
        warning,
        ...rest
    } = props

    const {
        isOpen,
        ...displayedFilters
    } = displayParams

    const translatedLabel = translate(
        label || `resources.${resource}.fields.${source}`,
        {_: label}
    );

    const listParams = {
        basePath: referenceBasePath,
        currentSort,
        data,
        defaultTitle,
        displayedFilters,
        filterValues,
        hasCreate: false,
        hideFilter,
        isLoading,
        onSelect,
        onToggleItem,
        onUnselectItems,
        page,
        perPage,
        resource: reference,
        selectedIds,
        setFilters,
        setPage,
        setPerPage,
        setSort,
        showFilter,
        translate,
        version,
    }

    const searchListProps = {
        children: searchGrid === undefined ? children : searchGrid,
        ids,
        total,
        loadedOnce,
        filters,
        exporter: false,
        bulkActionButtons: <AppendButton
            label="Append"
            resource={reference}
            source={source}
            clickHandler={onAppendIds}
        />,
    }

    const referenceListProps = {
        children,
        ids: referenceIds,
        total: referenceIds.length,
        loadedOnce: data !== undefined,
        actions: <ReferenceManyListActions handleShow={handleShow}/>,
        bulkActionButtons: <RemoveButton
            label="Remove Selected"
            resource={reference}
            source={source}
            clickHandler={onRemoveIds}
        />,
    }

    console.log({
        "search": {...{...listParams, ...searchListProps}},
        "reference": {...{...listParams, ...referenceListProps}}
    })

    return (
        <div>

            <InputLabel htmlFor={id} shrink className={classes.label}>
                <FieldTitle
                    label={translatedLabel}
                    source={source}
                    resource={reference}
                    isRequired={isRequired}
                />
            </InputLabel>
            <div className={classes.value}>
                {
                    isLoading
                        ? <LinearProgress/>
                        : error
                        ? <ReferenceError label={translatedLabel} error={error}/>
                        : <ListView {...{...listParams, ...referenceListProps}} />
                }
            </div>
            <Dialog
                fullScreen
                aria-labelledby="simple-modal-title"
                aria-describedby="simple-modal-description"
                open={isOpen}
                onClose={handleClose}
            >
                <AppBar className={classes.appBar}>
                    <Toolbar>
                        <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="Close">
                            <CloseIcon/>
                        </IconButton>
                        <Typography variant="title" color="inherit" className={classes.title}>
                            {defaultTitle}
                        </Typography>
                        <Button color="inherit" onClick={handleClose}>
                            Cancel
                        </Button>
                    </Toolbar>
                </AppBar>
                <div className={classes.paper}>
                    {
                        isLoading || !loadedOnce
                            ? <LinearProgress/>
                            : error
                            ? <ReferenceError label={translatedLabel} error={error}/>
                            : <ListView {...{...listParams, ...searchListProps}} {...sanitizeRestProps(rest)} />
                    }
                </div>
            </Dialog>
        </div>
    )
};

export const ReferenceManyListInputView = withStyles(styles)(UnstyledListView)

ReferenceManyListInputView.propTypes = {
    // ListView prop types
    actions: PropTypes.element,
    allowEmpty: PropTypes.bool,
    aside: PropTypes.node,
    basePath: PropTypes.string,
    bulkActionButtons: PropTypes.oneOfType([PropTypes.bool, PropTypes.element]),
    bulkActions: PropTypes.oneOfType([PropTypes.bool, PropTypes.element]),
    children: PropTypes.element,
    choices: PropTypes.array,
    classes: PropTypes.object,
    className: PropTypes.string,
    currentSort: PropTypes.shape({
        field: PropTypes.string,
        order: PropTypes.string,
    }),
    data: PropTypes.object,
    defaultTitle: PropTypes.string,
    displayParams: PropTypes.object,
    error: PropTypes.string,
    exporter: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
    filterDefaultValues: PropTypes.object,
    filters: PropTypes.element,
    filterValues: PropTypes.object,
    handleClose: PropTypes.func,
    handleShow: PropTypes.func,
    hasCreate: PropTypes.bool,
    hideFilter: PropTypes.func,
    ids: PropTypes.array,
    input: PropTypes.object.isRequired,
    isLoading: PropTypes.bool,
    label: PropTypes.string,
    loadedOnce: PropTypes.bool,
    meta: PropTypes.object,
    onChange: PropTypes.func,
    onSelect: PropTypes.func,
    onToggleItem: PropTypes.func,
    onUnselectItems: PropTypes.func,
    options: PropTypes.object,
    page: PropTypes.number,
    pagination: PropTypes.oneOfType([PropTypes.bool, PropTypes.element]),
    perPage: PropTypes.number,
    reference: PropTypes.string.isRequired,
    referenceBasePath: PropTypes.string,
    referenceIds: PropTypes.array,
    refresh: PropTypes.func,
    resource: PropTypes.string,
    selectedIds: PropTypes.array,
    setFilter: PropTypes.func,
    setFilters: PropTypes.func,
    setPage: PropTypes.func,
    setPagination: PropTypes.func,
    setPerPage: PropTypes.func,
    setSort: PropTypes.func,
    showFilter: PropTypes.func,
    source: PropTypes.string,
    title: PropTypes.any,
    total: PropTypes.number,
    translate: PropTypes.func.isRequired,
    version: PropTypes.number,
    warning: PropTypes.string,
};


ReferenceManyListInputView.defaultProps = {
    actions: <DefaultActions/>,
    classes: {},
    pagination: <DefaultPagination/>,
};

export const ReferenceManyListInput = ({children, ...props}) => {
    if (React.Children.count(children) !== 1) {
        throw new Error(
            '<ReferenceManyListInput> only accepts a single child (like <Datagrid>)'
        );
    }
    console.log(props)
    return (
        <ReferenceManyListInputController {...props}>
            {controllerProps => {
                console.log({
                    props,
                    controllerProps,
                    children
                })
                return (
                    <ReferenceManyListInputView
                        {...props}
                        {...{children, ...controllerProps}}
                    />
                )
            }}
        </ReferenceManyListInputController>
    );
};

ReferenceManyListInput.propTypes = {
    actions: PropTypes.element,
    allowEmpty: PropTypes.bool.isRequired,
    aside: PropTypes.node,
    authProvider: PropTypes.func,
    basePath: PropTypes.string,
    children: PropTypes.element.isRequired,
    classes: PropTypes.object,
    className: PropTypes.string,
    filter: PropTypes.object,
    filterDefaultValues: PropTypes.object,
    filters: PropTypes.element,
    filterToQuery: PropTypes.func.isRequired,
    input: PropTypes.object.isRequired,
    label: PropTypes.string,
    // location: PropTypes.object.isRequired,
    // match: PropTypes.object.isRequired,
    meta: PropTypes.object,
    pagination: PropTypes.element,
    // path: PropTypes.string,
    perPage: PropTypes.number,
    reference: PropTypes.string.isRequired,
    sort: PropTypes.shape({
        field: PropTypes.string,
        order: PropTypes.oneOf(['ASC', 'DESC']),
    }),
    source: PropTypes.string,
    // theme: PropTypes.object.isRequired,
    title: PropTypes.any,
    translate: PropTypes.func.isRequired,
};

ReferenceManyListInput.defaultProps = {
    allowEmpty: false,
    filter: {},
    filterToQuery: searchText => searchText,
    perPage: 25,
    sort: {field: 'id', order: 'DESC'},
    theme: defaultTheme,
    filterValues: {},
    hasCreate: false,
    ids: [],
    isLoading: false,
    location: {
        pathname: '',
        search: '',
        state: {},
        hash: ''
    },
    params: {},
    push: () => {
    },
    query: {},
    refresh: () => {
    },
    resource: 'post',
    total: 100,
    translate: x => x,
    version: 1,
};


const addRelatedField = (BaseComponent, fieldProps) => {
    console.log(BaseComponent)
    console.log(fieldProps)
    return props => (
        <div>
            <FormField component={BaseComponent} {...fieldProps} {...props} />
        </div>
    )
}

const EnhancedReferenceManyListInput = compose(
    // addField,
    // addRelatedField,
    addField,
    translate
)(ReferenceManyListInput);

export default EnhancedReferenceManyListInput;
