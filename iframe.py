from django.core.urlresolvers import reverse

from util.http import update_url_params
from util.templates import render_configured_template


def view(request, course, exercise, post_url):
    '''
    Renders an iframe to hold javascript based exercise from static files.
    '''
    url = '/static/' + course['key'] + exercise['iframe_src']
    result = {
        'src': update_url_params(url, {
            'submission_url': request.GET.get('submission_url'),
            'submit_url': request.build_absolute_uri(reverse(
                'access.views.exercise_ajax',
                args=[course['key'], exercise['key']])),
        }),
    }
    return render_configured_template(
        request, course, exercise, post_url, './iframe.html', result);
