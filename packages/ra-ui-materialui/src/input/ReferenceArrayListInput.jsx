import React, {Children, Component, Fragment, cloneElement} from 'react';
import compose from "recompose/compose"

import {
    AppBar,
    Dialog,
    FormControl,
    IconButton,
    Toolbar,
    Typography,
    createStyles,
    withStyles
} from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close';

import {
    addField,
    translate,
    getListControllerProps,
    ReferenceArrayListInputController
} from 'ra-core'

import ReferenceError from './ReferenceError';
import CardActions from "../layout/CardActions"
import LinearProgress from '../layout/LinearProgress'
import Button from "../button/Button"
import RemoveButton from '../button/RemoveButton'
import AppendButton from '../button/AppendButton'

import List from '../list/List'
import Pagination from '../list/Pagination'

import PartialReferenceArrayField from '../field/PartialReferenceArrayField'
import ReferenceField from "../field/ReferenceField"
import classnames from "classnames"
import sanitizeRestProps from "../field/sanitizeRestProps"


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
        fullWith: {
            display: 'block',
        },
        refRoot: {
            display: 'flex',
            position: 'absolute',
            width: `calc(100%)`,
            marginBottom: theme.spacing * 2,
        },
        refCard: {
            position: 'relative',
            flex: '1 1 auto',
        },
        refContent: {
            overflow: 'auto',
            '&::-webkit-scrollbar': {
                display: 'none'
            }
        },
        refActions: {
            zIndex: 2,
            display: 'flex',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
        },
        refHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignSelf: 'flex-start',
        },
        refNoResults: {padding: 20},
    });

export const ReferenceArrayListActions = props => {
    const {
        bulkActions,
        basePath,
        displayedFilters,
        filterValues,
        onUnselectItems,
        resource,
        selectedIds,
        showFilter,
        handleShow,
        input,
        isArrayInput,
    } = props

    return (
        <CardActions>
            {bulkActions && React.cloneElement(bulkActions, {
                basePath,
                filterValues,
                resource,
                selectedIds,
                onUnselectItems,
            })}
            <Button label={isArrayInput ? "Append Related" : "Change"} onClick={handleShow}/>
            {
                isArrayInput
                    ? null
                    : <Button label="Clear" variant="outlined" color="secondary" onClick={() => input.onChange("")}/>
            }
            {/* Add your custom actions */}
        </CardActions>
    )
};

const UnstyledReferenceArrayListInputView = props => {
    const {
        children,
        classes,
        defaultTitle,
        translatedLabel,
        error,
        meta,
        input,
        referenceBasePath,
        referenceComponent,
        isLoading,
        loadedOnce,
        isOpen,
        handleClose,
        handleShow,
        onAppendIds,
        onRemoveIds,
        onSelectOne,
        // ReferenceArrayField
        addLabel,
        allowEmpty,
        basePath,
        // classes,
        className,
        // children,
        label,
        record,
        reference,
        resource,
        sortBy,
        source,
        location,
        match,
        theme,
        filter,
        filters,
        listPagination,
        listPerPage,
        isArrayInput,
        ids,
        data,
        ...rest
    } = props

    const referenceArrayProps = {
        ...rest,
        ids,
        data,
        addLabel,
        basePath,
        classes,
        className,
        children,
        input,
        label,
        record,
        reference,
        resource,
        sortBy,
        source,
        actions: <ReferenceArrayListActions handleShow={handleShow} input={input} isArrayInput={isArrayInput}/>,
        bulkActionButtons: isArrayInput
            ? <RemoveButton
                label="Remove Selected"
                resource={reference}
                source={source}
                clickHandler={onRemoveIds}
            />
            : null,
    }

    const listProps = {
        basePath: referenceBasePath,
        location,
        match,
        pagination: listPagination,
        perPage: listPerPage,
        resource: reference,
        theme,
        filter,
        filters,
        noPush: true,
        hasCreate: false,
        hasEdit: false,
        hasList: false,
        hasShow: false,
        exporter: false,
        bulkActionButtons: isArrayInput
            ? <AppendButton
                label="Append"
                resource={reference}
                source={source}
                clickHandler={onAppendIds}
            />
            : false,
    }

    // if (isLoading) {
    //     return <LinearProgress/>
    // }
    //
    // if (error) {
    //     return <ReferenceError label={translatedLabel} error={error}/>
    // }
    const ReferenceComponent = () => {
        return input.value === undefined
            ? null
            : isArrayInput || !referenceComponent
                ? <PartialReferenceArrayField {...referenceArrayProps} />
                : input.value === "" || input.value === null
                    ? <Button label="Select" variant="outlined" color="primary" onClick={handleShow}/>
                    : <Fragment>
                        {
                            React.cloneElement(Children.only(referenceComponent), {
                            record: data,
                            resource: reference,
                            basePath,
                        })}
                        <Button label="Change" color="primary" onClick={handleShow}/>
                        <Button label="Clear" variant="outlined" color="secondary" onClick={() => input.onChange("")}/>
                    </Fragment>
    }

    return (
        <FormControl
            margin="normal"
            fullWidth={true}
            classes={classes.fullWidth}
            error={meta && meta.touched && !!meta.error}
        >
            <div
                className={classes.value}
            > {
                isOpen ? null : <ReferenceComponent/>
            }
            </div>
            <Dialog
                fullScreen
                aria-labelledby="simple-modal-title"
                aria-describedby="simple-modal-description"
                open={isOpen}
                onClose={handleClose}
            >
                <AppBar
                    className={classes.appBar}
                >
                    <Toolbar>
                        <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="Close">
                            <CloseIcon/>
                        </IconButton>
                        <Typography variant="title" color="inherit">
                            {defaultTitle}
                        </Typography>
                        <Button label="Cancel" color="inherit" onClick={handleClose}/>
                    </Toolbar>
                </AppBar>
                <div
                    className={classes.paper}
                >
                    <List {...listProps} >
                        {
                            isArrayInput ? children
                                : cloneElement(Children.only(children), {
                                    rowClick: (id, basePath, record) => onSelectOne(id)
                                })
                        }
                    </List>
                </div>
            </Dialog>
        </FormControl>
    )
}

export const ReferenceArrayListInputView = withStyles(styles)(UnstyledReferenceArrayListInputView)

const ReferenceArrayListInput = ({children, ...props}) => {
    return (
        <ReferenceArrayListInputController {...props}>
            {controllerProps => (
                <ReferenceArrayListInputView
                    {...props}
                    {...{children, ...controllerProps}}
                />
            )}
        </ReferenceArrayListInputController>
    )
}

ReferenceArrayListInput.defaultProps = {
    addLabel: true,
    allowEmpty: true,
    filter: {},
    perPage: 10,
    sort: {field: 'id', order: 'DESC'},
    match: {},
    listPerPage: 20,
    listPagination: <Pagination rowsPerPageOptions={[20, 50, 100]}/>,
    location: {
        pathname: '',
        search: '',
        state: {},
        hash: ''
    },
};

const EnhancedReferenceArrayListInput = compose(
    addField,
    translate,
)(ReferenceArrayListInput);

export default EnhancedReferenceArrayListInput