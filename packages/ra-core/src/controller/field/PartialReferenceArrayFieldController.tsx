import React, {Component, ReactNode} from "react"
import {connect} from 'react-redux';

import get from 'lodash/get';

import {
    changeListParams as changeListParamsAction, crudGetList as crudGetListAction,
    crudGetMany as crudGetManyAction,
    crudGetManyAccumulate as crudGetManyAccumulateAction,
    crudGetMatching as crudGetMatchingAction, ListParams
} from '../../actions';
import {getReferencesByIds} from '../../reducer/admin/references/oneToMany';

import {Record, Sort, Translate, Pagination, Dispatch, RecordMap, Identifier, AuthProvider} from '../../types';
import {MatchingReferencesError} from "../input/types";
import {LocationDescriptorObject, LocationState} from "history";

interface ChildrenFuncParams {
    loadedOnce: boolean;
    ids: Identifier[];
    data: RecordMap;
    referenceBasePath: string;
    currentSort: Sort;
    page: number;
    perPage: number;
    setPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    setSort: (field: string) => void;
    total: number;
}

interface Props {
    basePath: string;
    children: (params: ChildrenFuncParams) => ReactNode;
    crudGetManyAccumulate: Dispatch<typeof crudGetManyAccumulateAction>;
    data?: RecordMap;
    ids?: Identifier[];
    record?: Record;
    reference: string;
    resource: string;
    source: string;
}

interface State {
    page: number,
    perPage: number,
    sortedIds: Identifier[],
    currentIds: Identifier[],
    currentData: RecordMap;
    sort: Sort;
}

const sortIdsByDataKeys = (ids, data, field, order = 'ASC') => {
    const sortedIds = [...ids]
    const sortFunction = (id1, id2) => {
        if (!data) {
            return 0;
        }

        const a = data[isNaN(id1) ? id1 : parseInt(id1)]
        const b = data[isNaN(id2) ? id2 : parseInt(id2)]

        if (a === undefined || b === undefined || (!a.hasOwnProperty(field) && !b.hasOwnProperty(field))) {
            return 0;
        }

        let comparison = 0;

        const comparableValue = rawValue =>
            !isNaN(rawValue)
                ? parseFloat(rawValue)
                : (typeof rawValue === 'string')
                ? rawValue.toUpperCase()
                : rawValue

        if (a.hasOwnProperty(field) && !b.hasOwnProperty(field)) {
            comparison = 1
        } else if (!a.hasOwnProperty(field) && b.hasOwnProperty(field)) {
            comparison = -1
        } else {
            const varA = comparableValue(a[field])
            const varB = comparableValue(b[field])

            if (varA > varB) {
                comparison = 1;
            } else if (varA < varB) {
                comparison = -1;
            }
        }
        return (
            (order == 'DESC') ? (comparison * -1) : comparison
        );
    }
    sortedIds.sort(sortFunction)
    return sortedIds
}

export class UnconnectedPartialReferenceArrayFieldController extends Component<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            page: 1,
            perPage: 10,
            sortedIds: [],
            currentIds: [],
            sort: {
                field: 'id',
                order: 'DESC'
            },
            currentData: {}
        };
    }

    componentDidMount() {
        this.setCurrentIds();
    }

    componentWillReceiveProps(nextProps) {
        if (
            (this.props.ids !== nextProps.ids) ||
            (this.props.data !== nextProps.data)
        ) {

            if (!nextProps.data || !nextProps.ids || !nextProps.ids.every(x => x in nextProps.data)) {
                this.fetchReferences(nextProps);
            } else {
                this.setCurrentIds(nextProps)
            }
        }
    }

    setCurrentIds = ({ids, data} = this.props) => {
        const {
            page,
            perPage,
            sort
        } = this.state

        const {
            field,
            order
        } = sort

        if (!ids) {
            return null
        }

        if (!data || !ids.every(function (x) {
            return x in data;
        })) {
            this.fetchReferences();
        }

        const sortedIds = sortIdsByDataKeys(ids, data, field, order)

        const begin = ((page - 1) * perPage);
        const end = begin + perPage;
        const currentIds = sortedIds.slice(begin, end)
        const currentData = {}

        if (data) {
            currentIds.map(x => currentData[x] = data[x])
        }

        this.setState({
            currentIds: currentIds,
            currentData,
            sortedIds
        })
    }

    fetchReferences({crudGetManyAccumulate, reference, ids} = this.props) {
        crudGetManyAccumulate(reference, ids);
    }

    setSort = (field) => {
        const order =
            this.state.sort.field === field &&
            this.state.sort.order === "ASC"
                ? "DESC"
                : "ASC";
        this.setState({sort: {field, order}}, this.setCurrentIds);
    };

    setPage = (page) => this.setState({page}, this.setCurrentIds);

    setPerPage = (perPage) => this.setState({perPage}, this.setCurrentIds);

    render() {
        const {
            resource,
            reference,
            data,
            ids,
            children,
            basePath,
            ...rest
        } = this.props;

        const {
            page,
            perPage,
            currentIds,
            currentData,
            sort,
        } = this.state;

        const referenceBasePath = basePath.replace(resource, reference);
        const total = ids.length

        return children({
            currentSort: sort,
            data: currentData,
            ids: currentIds,
            loadedOnce: data !== undefined && data !== null && typeof ids !== 'undefined' && ids.every(x => x in data),
            page,
            perPage,
            referenceBasePath,
            setPage: this.setPage,
            setPerPage: this.setPerPage,
            setSort: this.setSort,
            total,
            ...rest
        });
    }
}

const mapStateToProps = (state, props) => {
    const {
        record,
        source,
        reference,
        data
    } = props;

    const ids = props.ids || get(record, source) || [];

    return {
        ids,
        data: data || ids ? getReferencesByIds(state, reference, ids) : {},
    };
};

const PartialReferenceArrayFieldController = connect(
    mapStateToProps,
    {
        crudGetManyAccumulate: crudGetManyAccumulateAction,
    }
)(UnconnectedPartialReferenceArrayFieldController);

export default PartialReferenceArrayFieldController;