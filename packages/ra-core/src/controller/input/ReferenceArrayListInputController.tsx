import React, {Component, ReactNode} from "react"
import {connect} from 'react-redux';
import {compose} from "recompose"
import {withRouter} from 'react-router';
import uniq from 'lodash/uniq';
import get from 'lodash/get';

import withTranslate from '../../i18n/translate';

import {crudGetManyAccumulate as crudGetManyAccumulateAction} from '../../actions';
import {getReferencesByIds} from '../../reducer/admin/references/oneToMany';
import {Dispatch, Identifier, Record, RecordMap, Sort} from "../../types";


interface ChildrenFuncParams {
    loadedOnce: boolean;
    ids: Identifier[];
    data: RecordMap;
    referenceBasePath: string;
    classes,
    input,
    isOpen,
    addLabel,
    className,
    label,
    record,
    sortBy,
    source,
    basePath,
    reference,
    resource,
    isLoading,
    error,
    meta,
    handleClose,
    handleShow,
    onAppendIds,
    onRemoveIds,
    onSelect,
    onUnselectItems,
    onToggleItem,
    onSelectOne,
    translatedLabel,
    selectedIds,
    actions,
    bulkActionButtons,
    referenceComponent
}

interface Props {
    basePath: string;
    children: (params: ChildrenFuncParams) => ReactNode;
    data?: RecordMap;
    ids?: Identifier[];
    record?: Record;
    reference: string;
    resource: string;
    source: string;
    classes,
    translatedLabel,
    error,
    meta,
    input,
    referenceBasePath,
    className,
    sortBy,
    addLabel,
    label,
    isLoading,
    loadedOnce,
    handleClose,
    handleShow,
    actions,
    bulkActionButtons,
    referenceComponent?
}

interface EnhancedProps {
    crudGetManyAccumulate: Dispatch<typeof crudGetManyAccumulateAction>;

    location: {
        pathname: '',
        search: '',
        state: {},
        hash: ''
    },
    filter: {},
    perPage: 10,
}

interface State {
    isOpen: boolean,
    selectedIds: Identifier[],
}

export class UnconnectedReferenceArrayListInputController extends Component<Props & EnhancedProps, State> {
    constructor(props) {
        super(props);
        this.state = {
            isOpen: false,
            selectedIds: []
        };

        this.handleShow = this.handleShow.bind(this);
        this.handleClose = this.handleClose.bind(this);
    }

    handleSelect = (ids) => {
        this.setSelectedIds(ids);
    };

    handleUnselectItems = () => {
        this.setSelectedIds([]);
    };

    handleToggleItem = (toggleId) => {
        const {
            selectedIds
        } = this.state
        if (selectedIds.includes(toggleId)) {
            const {
                [toggleId]: removed,
                ...remaining
            } = selectedIds
            this.setSelectedIds(remaining)
        } else {
            this.setSelectedIds([toggleId, ...this.state.selectedIds])
        }
    };

    handleClose() {
        this.setState({isOpen: false});
        this.handleUnselectItems()
    }

    handleShow() {
        this.setState({isOpen: true});
    }

    setSelectedIds = (ids) => {
        const uniqueIds = uniq<string>(ids);
        this.setState({selectedIds: uniqueIds})
    };

    setIds = (ids) => {
        const uniqueIds = uniq(ids);
        this.props.input.onChange(uniqueIds);
        this.handleClose()
    };

    onSelectOne = (id) => {
        this.props.input.onChange(id);
        this.handleClose()
    };

    onAppendIds = (source, ids) => {
        this.setIds([
            ...(this.props.input.value || []),
            ...ids
        ])
    };

    onRemoveIds = (source, selectedIds) => {
        const keepIds = this.props.input.value.filter(
            val => !selectedIds.includes(val)
        );
        this.setIds([
            ...keepIds
        ]);
        this.handleUnselectItems();
    };

    render() {
        const {
            children,
            classes,
            translatedLabel,
            error,
            meta,
            input,
            referenceBasePath,
            basePath,
            // classes,
            className,
            // children,
            record,
            reference,
            resource,
            sortBy,
            source,
            data,

            addLabel,
            label,
            ids,
            isLoading,
            loadedOnce,
            handleClose,
            handleShow,
            actions,
            bulkActionButtons,
            referenceComponent,
            ...rest
        } = this.props;
        const {
            isOpen,
            selectedIds
        } = this.state


        return children({
            classes,
            input,
            isOpen,
            // ReferenceArrayField
            addLabel,
            // classes,
            className,
            // children,
            label,
            record,
            sortBy,
            source,
            basePath,
            referenceBasePath,
            reference,
            resource,
            ids,
            data,
            isLoading,
            loadedOnce,
            error,
            meta,
            handleClose: this.handleClose,
            handleShow: this.handleShow,
            onAppendIds: this.onAppendIds,
            onRemoveIds: this.onRemoveIds,
            onSelect: this.handleSelect,
            onUnselectItems: this.handleUnselectItems,
            onToggleItem: this.handleToggleItem,
            onSelectOne: this.onSelectOne,
            translatedLabel,
            selectedIds,
            actions,
            bulkActionButtons,
            referenceComponent,
            ...rest
        });
    }
}


const mapStateToProps = (state, props) => {
    const resourceState = state.admin.resources[props.reference];
    const referenceBasePath = props.basePath.replace(props.resource, props.reference);

    const inputVal = state.form["record-form"] ? get(state.form["record-form"].values, props.source) : null
    // const inputVal = props.input.value === "" ? null : props.input.value
    const isArrayInput = Array.isArray(inputVal)

    return {
        basePath: props.basePath,
        referenceBasePath,
        loadedOnce: resourceState.data === resourceState.list.loadedOnce,
        isLoading: state.admin.loading > 0,
        version: state.admin.ui.viewVersion,
        reference: props.reference,
        referenceType: resourceState.props.options.referenceType || props.reference,
        resource: props.resource,
        isArrayInput,
        ids: isArrayInput
            ? inputVal
            : inputVal === null || inputVal === undefined
                ? null
                : [inputVal],
        data: isArrayInput
            ? inputVal.length === 0
                ? null
                : getReferencesByIds(state, props.reference, inputVal)
            : inputVal === null || inputVal === undefined
                ? null
                : resourceState.data[inputVal],
        location: state.router.location,
    };
}

const ReferenceArrayListInputController = compose(
    withTranslate,
    withRouter,
    connect(
        mapStateToProps,
        {
            crudGetManyAccumulate: crudGetManyAccumulateAction,
        }
    )
)(UnconnectedReferenceArrayListInputController);

export default ReferenceArrayListInputController