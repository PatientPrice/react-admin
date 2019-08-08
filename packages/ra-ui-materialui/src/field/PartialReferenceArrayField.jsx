import React, {Fragment, cloneElement, Children} from 'react';
import PropTypes from 'prop-types';
import compose from "recompose/compose"
import {
    createStyles,
    withStyles,
    Card
} from "@material-ui/core"
import {
    getListControllerProps,
    PartialReferenceArrayFieldController
} from 'ra-core'
import {
    Pagination,
    BulkActionsToolbar,
    ListToolbar,
} from '../list';
import LinearProgress from '../layout/LinearProgress'
import defaultTheme from '../defaultTheme';

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

export const PartialReferenceArrayFieldView = props => {
    const {
        classes,
        children,
        filter,
        filters,
        actions,
        className,
        currentSort,
        data,
        ids,
        loadedOnce,
        page,
        pagination,
        perPage,
        reference,
        referenceBasePath,
        setPage,
        setPerPage,
        setSort,
        total,
        bulkActions,
        bulkActionButtons,
        ...rest
    } = props
    const controllerProps = getListControllerProps(props)

    if (!loadedOnce) {
        return <LinearProgress/>
    }
    return (
        <Fragment>
            <Card className={classes.card}>
                {bulkActions !== false &&
                bulkActionButtons !== false &&
                bulkActionButtons &&
                !bulkActions && (
                    <BulkActionsToolbar {...controllerProps}>
                        {bulkActionButtons}
                    </BulkActionsToolbar>
                )}
                {(filters || actions) && (
                    <ListToolbar
                        filters={filters}
                        {...controllerProps}
                        actions={actions}
                        bulkActions={bulkActions}
                        exporter={false}
                        permanentFilter={filter}
                    />
                )}
                {cloneElement(Children.only(children), {
                    ...controllerProps,
                    className,
                    resource: reference,
                    ids,
                    loadedOnce,
                    data,
                    basePath: referenceBasePath,
                    currentSort,
                    setSort,
                    total,
                    hasBulkActions: !!bulkActions || !!bulkActionButtons,
                })}
                {pagination &&
                total !== undefined &&
                cloneElement(pagination, {
                    page,
                    perPage,
                    setPage,
                    setPerPage,
                    total,
                })}
            </Card>
        </Fragment>
    )
};

PartialReferenceArrayFieldView.propTypes = {
    children: PropTypes.element,
    className: PropTypes.string,
    currentSort: PropTypes.shape({
        field: PropTypes.string,
        order: PropTypes.string,
    }),
    data: PropTypes.object,
    ids: PropTypes.array,
    loadedOnce: PropTypes.bool,
    pagination: PropTypes.element,
    reference: PropTypes.string,
    referenceBasePath: PropTypes.string,
    setSort: PropTypes.func,
};

export const PartialReferenceArrayField = ({children, ...props}) => {
    if (React.Children.count(children) !== 1) {
        throw new Error(
            '<PartialReferenceArrayField> only accepts a single child (like <Datagrid>)'
        );
    }

    return (
        <PartialReferenceArrayFieldController {...props}>
            {controllerProps => (
                <PartialReferenceArrayFieldView
                    {...props}
                    {...{children, ...controllerProps}}
                />
            )}
        </PartialReferenceArrayFieldController>
    );
};

PartialReferenceArrayField.propTypes = {
    addLabel: PropTypes.bool,
    basePath: PropTypes.string,
    children: PropTypes.element.isRequired,
    classes: PropTypes.object,
    className: PropTypes.string,
    label: PropTypes.string,
    perPage: PropTypes.number,
    record: PropTypes.object,
    reference: PropTypes.string.isRequired,
    resource: PropTypes.string,
    sortBy: PropTypes.string,
    source: PropTypes.string.isRequired,
    sort: PropTypes.shape({
        field: PropTypes.string,
        order: PropTypes.string,
    }),
};

const EnhancedPartialReferenceArrayField = compose(
    withStyles(styles)
)(PartialReferenceArrayField);

EnhancedPartialReferenceArrayField.defaultProps = {
    filter: {},
    perPage: 10,
    sort: {field: 'id', order: 'DESC'},
    source: 'id',
    addLabel: true,
    pagination: <Pagination/>,
    fullWidth: true,
};

export default EnhancedPartialReferenceArrayField;
