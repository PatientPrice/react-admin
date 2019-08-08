import CardActions from "../layout/CardActions"
import React from "react"
import Button from "../button/Button"

export const ReferenceManyListActions = props => {
    const {
        bulkActions,
        basePath,
        displayedFilters,
        filters,
        filterValues,
        onUnselectItems,
        resource,
        selectedIds,
        showFilter,
        handleShow,
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
            {filters && React.cloneElement(filters, {
                resource,
                showFilter,
                displayedFilters,
                filterValues,
                context: 'button',
            })}
            <Button label="Append Related" onClick={handleShow}/>
            {/* Add your custom actions */}
        </CardActions>
    )
};

export default ReferenceManyListActions