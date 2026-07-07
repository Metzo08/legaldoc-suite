from rest_framework.pagination import PageNumberPagination

class OptionalPageNumberPagination(PageNumberPagination):
    """
    Pagination class that behaves like PageNumberPagination but allows the client
    to specify a custom page size via the 'page_size' query parameter, or
    completely bypass pagination by passing page_size=0, page_size=all, or page_size=all_items.
    """
    page_size_query_param = 'page_size'
    max_page_size = 10000
    
    def paginate_queryset(self, queryset, request, view=None):
        page_size = request.query_params.get(self.page_size_query_param)
        if page_size in ['0', 'all', 'all_items']:
            return None
        return super().paginate_queryset(queryset, request, view)
