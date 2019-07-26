import {Component, ReactNode, ComponentType, ReactElement} from 'react';
import {connect} from 'react-redux';
import debounce from 'lodash/debounce';
import uniq from 'lodash/uniq';
import compose from 'recompose/compose';
import {createSelector} from 'reselect';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import difference from 'lodash/difference';

import inflection from 'inflection';

import {parse, stringify} from 'query-string';

import {push as pushAction} from 'react-router-redux';
import {WrappedFieldInputProps, change} from 'redux-form';

import {
    crudGetList as crudGetListAction,
    crudGetMany as crudGetManyAction,
    crudGetMatching as crudGetMatchingAction,
} from '../../actions/dataActions';
import {
    getPossibleReferences,
    getPossibleReferenceValues,
    getReferenceResource,
} from '../../reducer';
import {getStatusForArrayInput as getDataStatus} from './referenceDataStatus';
import withTranslate from '../../i18n/translate';
import {Record, Sort, Translate, Pagination, Dispatch, RecordMap, Identifier, AuthProvider} from '../../types';
import {MatchingReferencesError} from './types';
import {
    changeListParams as changeListParamsAction, ListParams,
    setListSelectedIds as setListSelectedIdsAction, toggleListItem as toggleListItemAction
} from "../../actions";

import {selectListControllerQuery} from '../ListController'
import {Location, LocationDescriptorObject, LocationState} from "history";
import queryReducer, {
    SET_FILTER,
    SET_PAGE,
    SET_PER_PAGE,
    SET_SORT, SORT_DESC
} from "../../reducer/admin/resource/list/queryReducer";
import removeKey from "../../util/removeKey";
import removeEmpty from "../../util/removeEmpty";

const defaultReferenceSource = (resource: string, source: string) =>
    `${resource}@${source}`;

interface ChildrenFuncParams {
    choices: Record[];
    error?: string;
    isLoading: boolean;
    onChange: (value: any) => void;
    setFilter: (filter: any) => void;
    setPagination: (pagination: Pagination) => void;
    setSort: (sort: Sort) => void;
    warning?: string;
    setIds: (ids: any) => void;
    onAppendIds: (source, ids) => void;
    onRemoveIds: (source, selectedIds) => void;

    basePath: string;
    currentSort: Sort;
    data: RecordMap;
    defaultTitle: string;
    displayParams: any;
    filterValues: any;
    hasCreate: boolean;
    hideFilter: (filterName: string) => void;
    ids: Identifier[];
    loadedOnce: boolean;
    onSelect: (ids: Identifier[]) => void;
    onToggleItem: (id: Identifier) => void;
    onUnselectItems: () => void;
    page: number;
    perPage: number;
    resource: string;
    selectedIds: Identifier[];
    setFilters: (filters: any) => void;
    setPage: (page: number) => void;
    setPerPage: (page: number) => void;
    handleClose: () => void;
    handleShow: () => void;
    showFilter: (filterName: string, defaultValue: any) => void;
    translate: Translate;
    total: number;
    version: number;
}

interface Props {
    allowEmpty?: boolean;
    basePath: string;
    children: (params: ChildrenFuncParams) => ReactNode;
    handleClose: () => void;
    handleShow: () => void;
    filter?: object;
    filterToQuery: (filter: {}) => any;
    input?: WrappedFieldInputProps;
    meta?: object;
    perPage?: number;
    record?: Record;
    reference: string;
    referenceType: string;
    referenceSource: typeof defaultReferenceSource;
    resource: string;
    sort?: Sort;
    source: string;
    filters?: ReactElement<any>;
    filterDefaultValues?: object;
    pagination?: ReactElement<any>;
    // the props managed by react-admin
    authProvider?: AuthProvider;
    debounce?: number;
    hasCreate?: boolean;
    hasEdit?: boolean;
    hasList?: boolean;
    hasShow?: boolean;
    location: Location;
    path?: string;
    query: ListParams;

    [key: string]: any;
}

interface EnhancedProps {
    crudGetMatching: Dispatch<typeof crudGetMatchingAction>;
    crudGetMany: Dispatch<typeof crudGetManyAction>;
    matchingReferences?: Record[] | MatchingReferencesError;
    onChange?: () => void;
    referenceRecords?: Record[];
    translate: Translate;
    changeListParams: Dispatch<typeof changeListParamsAction>;
    crudGetList: Dispatch<typeof crudGetListAction>;
    data?: RecordMap;
    ids?: Identifier[];
    isLoading: boolean;
    loadedOnce?: boolean;
    params: ListParams;
    push: (location: LocationDescriptorObject<LocationState>) => void;
    selectedIds?: Identifier[];
    setSelectedIds: (resource: string, ids: Identifier[]) => void;
    toggleItem: (resource: string, id: Identifier) => void;
    total: number;
    version?: number;
}

export class UnconnectedReferenceManyListInputController extends Component<Props & EnhancedProps, object> {
    public static defaultProps = {
        allowEmpty: false,
        filter: {},
        filterToQuery: searchQuery => searchQuery,
        matchingReferences: null,
        perPage: 25,
        sort: {field: 'id', order: 'DESC'},
        referenceRecords: [],
        referenceSource: defaultReferenceSource, // used in unit tests
        debounce: 500,
    };
    setFilters = debounce(filters => {
        if (isEqual(filters, this.getFilterValues())) {
            return;
        }

        // fix for redux-form bug with onChange and enableReinitialize
        const filtersWithoutEmpty = removeEmpty(filters);
        this.changeParams({type: SET_FILTER, payload: filtersWithoutEmpty});
    }, this.props.debounce);
    private params;
    private debouncedSetFilter;

    constructor(props: Props & EnhancedProps) {
        super(props);
        const {perPage, sort, filter} = props;
        // stored as a property rather than state because we don't want redraw of async updates
        this.params = {pagination: {page: 1, perPage}, sort, filter};
        this.debouncedSetFilter = debounce(this.setFilter.bind(this), 500);

        this.state = {
            isOpen: false
        };

        this.handleShow = this.handleShow.bind(this);
        this.handleClose = this.handleClose.bind(this);

        console.log(this)
    }

    componentDidMount() {
        console.log("componentDidMount");
        console.log(this.props);

        const metaSource = this.props.source.replace(".id", ".meta");
        this.props.meta["dispatch"](
            change(
                this.props.meta["form"],
                metaSource,
                {
                    reference: this.props.reference,
                    referenceType: this.props.referenceType
                }
                )
        );
        this.fetchReferencesAndOptions(this.props, {} as Props & EnhancedProps);
    }

    componentWillReceiveProps(nextProps: Props & EnhancedProps) {
        let shouldFetchOptions = false;

        if (
            (this.props.record || {id: undefined}).id !==
            (nextProps.record || {id: undefined}).id
        ) {
            this.fetchReferencesAndOptions(nextProps);
        } else if (this.props.input.value !== nextProps.input.value) {
            this.fetchReferences(nextProps);
        } else {
            if (!isEqual(nextProps.filter, this.props.filter)) {
                this.params = {...this.params, filter: nextProps.filter};
                shouldFetchOptions = true;
            }
            if (!isEqual(nextProps.sort, this.props.sort)) {
                this.params = {...this.params, sort: nextProps.sort};
                shouldFetchOptions = true;
            }
            if (nextProps.perPage !== this.props.perPage) {
                this.params = {
                    ...this.params,
                    pagination: {
                        ...this.params.pagination,
                        perPage: nextProps.perPage,
                    },
                };
                shouldFetchOptions = true;
            }
            if (
                nextProps.resource !== this.props.resource ||
                nextProps.reference !== this.props.reference ||
                nextProps.query.sort !== this.props.query.sort ||
                nextProps.query.order !== this.props.query.order ||
                nextProps.query.page !== this.props.query.page ||
                nextProps.query.perPage !== this.props.query.perPage ||
                !isEqual(nextProps.query.filter, this.props.query.filter) ||
                !isEqual(nextProps.filter, this.props.filter) ||
                !isEqual(nextProps.sort, this.props.sort) ||
                !isEqual(nextProps.perPage, this.props.perPage)
            ) {
                this.updateData(
                    Object.keys(nextProps.query).length > 0
                        ? nextProps.query
                        : nextProps.params
                );
            }
            if (nextProps.version !== this.props.version) {
                this.updateData();
            }
        }
        if (shouldFetchOptions) {
            this.fetchOptions();
        }
    }

    // shouldComponentUpdate(nextProps: Props & EnhancedProps, nextState) {
    //     if (
    //         nextProps.className === this.props.className &&
    //         nextProps.translate === this.props.translate &&
    //         nextProps.isLoading === this.props.isLoading &&
    //         nextProps.version === this.props.version &&
    //         nextState === this.state &&
    //         nextProps.data === this.props.data &&
    //         nextProps.selectedIds === this.props.selectedIds &&
    //         nextProps.total === this.props.total &&
    //         nextProps.permissions === this.props.permissions
    //     ) {
    //         return false;
    //     }
    //     return true;
    // }

    /**
     * Check if user has already set custom sort, page, or filters for this list
     *
     * User params come from the Redux store as the params props. By default,
     * this object is:
     *
     * { filter: {}, order: null, page: 1, perPage: null, sort: null }
     *
     * To check if the user has custom params, we must compare the params
     * to these initial values.
     *
     * @param {object} params
     */
    hasCustomParams(params: ListParams) {
        return (
            params &&
            params.filter &&
            (Object.keys(params.filter).length > 0 ||
                params.order != null ||
                params.page !== 1 ||
                params.perPage != null ||
                params.sort != null)
        );
    }

    /**
     * Merge list params from 4 different sources:
     *   - the query string
     *   - the params stored in the state (from previous navigation)
     *   - the filter defaultValues
     *   - the props passed to the List component
     */
    getQuery() {
        const query: Partial<ListParams> =
            Object.keys(this.props.query).length > 0
                ? this.props.query
                : this.hasCustomParams(this.props.params)
                ? {...this.props.params}
                : {filter: this.props.filterDefaultValues || {}};

        if (!query.sort) {
            query.sort = this.props.sort.field;
            query.order = this.props.sort.order;
        }
        if (!query.perPage) {
            query.perPage = this.props.perPage;
        }
        if (!query.page) {
            query.page = 1;
        }
        return query as ListParams;
    }

    getFilterValues() {
        const query = this.getQuery();
        return query.filter || {};
    }

    updateData(query?: any) {
        const params = query || this.getQuery();
        const {sort, order, page = 1, perPage, filter} = params;
        const pagination = {
            page: parseInt(page, 10),
            perPage: parseInt(perPage, 10),
        };
        const permanentFilter = this.props.filter;
        console.log({
            props: this.props,
            resource: this.props.reference,
            query,
            pagination,
            sort,
            order,
            filter,
            permanentFilter
        });
        this.props.crudGetList(
            this.props.reference,
            pagination,
            {field: sort, order},
            {...filter, ...permanentFilter}
        );
    }

    setSort = sort => this.changeParams({type: SET_SORT, payload: {sort}});

    setPage = page => this.changeParams({type: SET_PAGE, payload: page});

    setPerPage = perPage =>
        this.changeParams({type: SET_PER_PAGE, payload: perPage});

    showFilter = (filterName: string, defaultValue: any) => {
        this.setState({[filterName]: true});
        if (typeof defaultValue !== 'undefined') {
            this.setFilters({
                ...this.getFilterValues(),
                [filterName]: defaultValue,
            });
        }
    };

    hideFilter = (filterName: string) => {
        this.setState({[filterName]: false});
        const newFilters = removeKey(this.getFilterValues(), filterName);
        this.setFilters(newFilters);
    };

    handleSelect = (ids: Identifier[]) => {
        this.props.setSelectedIds(this.props.reference, ids);
    };

    handleUnselectItems = () => {
        this.props.setSelectedIds(this.props.reference, []);
    };

    handleToggleItem = (id: Identifier) => {
        this.props.toggleItem(this.props.reference, id);
    };

    changeParams(action) {
        const newParams = queryReducer(this.getQuery(), action);
        this.props.push({
            ...this.props.location,
            search: `?${stringify({
                ...newParams,
                filter: JSON.stringify(newParams.filter),
            })}`,
        });
        this.props.changeListParams(this.props.reference, newParams);
    }

    setIds = (ids) => {
        const uniqueIds = uniq<string>(ids);

        console.log("change form");
        this.props.input.onChange(uniqueIds);

        console.log("change filter");
        this.setFilter({
            "name": "id",
            "op": "in_",
            "val": uniqueIds.map(x => parseInt(x))
        });

        console.log("change state");
        this.handleClose()
    };

    onSelectOne = (id) => {
        this.props.input.onChange(id);
        this.handleClose()
    };

    onAppendIds = (source, ids) => {
        console.log({source, ids, props: this.props});
        this.setIds([
            ...(this.props.input.value || []),
            ...ids
        ])
    };

    onRemoveIds = (source, selectedIds) => {
        console.log({source, selectedIds, props: this.props});
        const keepIds = this.props.input.value.filter(
            val => !selectedIds.includes(val)
        );
        console.log(keepIds);
        this.setIds([
            ...keepIds
        ]);
        this.handleUnselectItems();
    };

    handleClose() {
        this.setState({isOpen: false});
        this.handleUnselectItems()
    }

    handleShow() {
        this.setState({isOpen: true});
        this.updateData();
        if (this.props.input.value) {
            this.handleSelect(this.props.input.value);
        }
    }

    setFilter = (filter: any) => {
        if (filter !== this.params.filter) {
            this.params.filter = this.props.filterToQuery(filter);
            this.fetchOptions();
        }
    };

    setPagination = (pagination: Pagination) => {
        if (pagination !== this.params.pagination) {
            this.params.pagination = pagination;
            this.fetchOptions();
        }
    };

    fetchReferences = (nextProps, currentProps = this.props) => {
        const {crudGetMany, input, reference} = nextProps;
        const ids = Array.isArray(input.value)
            ? input.value
            : input.value == ""
                ? []
                : [input.value];

        if (ids) {
            if (Array.isArray(ids)) {
                const idsToFetch = difference(
                    ids,
                    get(currentProps, 'input.value', [])
                );
                if (idsToFetch.length) {
                    console.log({currentProps, nextProps});
                    crudGetMany(reference, idsToFetch);
                }
            }
        }
    };

    fetchOptions = (props = this.props) => {
        const {
            crudGetMatching,
            reference,
            source,
            resource,
            referenceSource,
            filter: defaultFilter,
        } = props;
        const {pagination, sort, filter} = this.params;

        console.log({props: this.props, params: this.params});
        crudGetMatching(
            reference,
            referenceSource(resource, source),
            pagination,
            sort,
            {
                ...filter,
                ...defaultFilter,
            }
        );
    };

    fetchReferencesAndOptions(nextProps, currentProps = this.props) {
        this.fetchReferences(nextProps, currentProps);
        this.fetchOptions(nextProps);
    }

    render() {
        const {
            actions,
            allowEmpty,
            aside,
            basePath,
            children,
            choices,
            classes,
            className,
            data,
            error,
            exporter,
            filter,
            filters,
            hasCreate,
            ids,
            input,
            isLoading,
            isRequired,
            label,
            loadedOnce,
            matchingReferences,
            meta,
            onAppendIds,
            onChange,
            onRemoveIds,
            rowClick,
            options,
            pagination,
            query,
            reference,
            referenceBasePath,
            referenceIds,
            referenceRecords,
            resource,
            selectedIds,
            setFilter,
            setIds,
            setPagination,
            setSort,
            showButton,
            source,
            title,
            total,
            translate,
            version,
            warning,
        } = this.props;

        const dataStatus = getDataStatus({
            input,
            matchingReferences,
            referenceRecords,
            translate,
        });

        const resourceName = translate(`resources.${resource}.name`, {
            smart_count: 2,
            _: inflection.humanize(inflection.pluralize(resource)),
        });
        const defaultTitle = translate('ra.page.list', {
            name: resourceName,
        });

        const referenceName = translate(`resources.${reference}.name`, {
            smart_count: 2,
            _: inflection.humanize(inflection.pluralize(reference)),
        });
        const defaultReferenceTitle = translate('ra.page.list', {
            name: referenceName,
        });

        console.log(this.props);

        const passParams = {
            filters,
            input,
            choices: dataStatus.choices,
            error: dataStatus.error,
            isLoading,
            isOpen: this.state["isOpen"],
            onChange,
            setFilter: this.debouncedSetFilter,
            setPagination: this.setPagination,
            setSort: this.setSort,
            handleClose: this.handleClose,
            handleShow: this.handleShow,
            warning: dataStatus.warning,
            onAppendIds: this.onAppendIds,
            onRemoveIds: this.onRemoveIds,
            setIds: this.setIds,
            label,
            basePath,
            referenceBasePath,
            currentSort: {
                field: query.sort,
                order: query.order,
            },
            data,
            defaultTitle: defaultReferenceTitle,
            displayParams: this.state,
            filterValues: this.getFilterValues(),
            hasCreate,
            hideFilter: this.hideFilter,
            ids,
            loadedOnce: typeof ids !== 'undefined',
            onSelect: this.handleSelect,
            onSelectOne: this.onSelectOne,
            onToggleItem: this.handleToggleItem,
            onUnselectItems: this.handleUnselectItems,
            page:
                (typeof query.page === 'string'
                    ? parseInt(query.page, 10)
                    : query.page) || 1,
            perPage:
                (typeof query.perPage === 'string'
                    ? parseInt(query.perPage, 10)
                    : query.perPage) || 10,
            reference,
            referenceIds,
            resource,
            rowClick,
            selectedIds,
            setFilters: this.setFilters,
            setPage: this.setPage,
            setPerPage: this.setPerPage,
            showButton,
            showFilter: this.showFilter,
            translate,
            total,
            version,
        };

        console.log(passParams);
        return children(passParams);
    }
}

const makeMapStateToProps = () =>
    createSelector(
        [
            getReferenceResource,
            getPossibleReferenceValues,
            (_, {input: {value: referenceIds}}) => referenceIds || [],
        ],
        (referenceState, possibleValues, inputIds) => {
            console.log({referenceState, possibleValues, inputIds});
            return (
                {
                    matchingReferences: getPossibleReferences(
                        referenceState,
                        possibleValues,
                        inputIds
                    ),
                    referenceRecords:
                        referenceState &&
                        inputIds.reduce((references, referenceId) => {
                            if (referenceState.data[referenceId]) {
                                references.push(referenceState.data[referenceId]);
                            }
                            return references;
                        }, []),
                })
        }
    );

function mapStateToProps(state, props) {
    console.log(props);

    const resourceState = state.admin.resources[props.reference];
    const referenceBasePath = props.basePath.replace(props.resource, props.reference);

    const mapProps = {
        basePath: props.basePath,
        referenceBasePath,
        query: selectListControllerQuery(props),
        params: resourceState.list.params,
        ids: resourceState.list.ids,
        loadedOnce: resourceState.data === resourceState.list.loadedOnce,
        selectedIds: resourceState.list.selectedIds,
        total: resourceState.list.total,
        data: resourceState.data,
        isLoading: state.admin.loading > 0,
        version: state.admin.ui.viewVersion,
        reference: props.reference,
        referenceType: resourceState.props.options.referenceType || props.reference,
        resource: props.resource,
        referenceIds: props.input.value === "" ? [] : props.input.value,
        location: state.router.location,
        ...makeMapStateToProps()
    };
    console.log({props, mapProps});
    return mapProps
}

const ReferenceManyListInputController = compose(
    withTranslate,
    connect(
        mapStateToProps,
        {
            crudGetMany: crudGetManyAction,
            crudGetMatching: crudGetMatchingAction,
            crudGetList: crudGetListAction,
            changeListParams: changeListParamsAction,
            setSelectedIds: setListSelectedIdsAction,
            toggleItem: toggleListItemAction,
            push: pushAction,
        }
    )
)(UnconnectedReferenceManyListInputController);

ReferenceManyListInputController.defaultProps = {
    referenceSource: defaultReferenceSource, // used in makeMapStateToProps
    location: {
        pathname: '',
        search: '',
        state: {},
        hash: ''
    },
    filter: {},
    perPage: 10,
};

export default ReferenceManyListInputController as ComponentType<Props>;
